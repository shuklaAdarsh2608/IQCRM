import nodemailer from "nodemailer";
import webpush from "web-push";
import { NotificationLog } from "../models/NotificationLog.js";
import { NotificationPreference } from "../models/NotificationPreference.js";
import { PushSubscription } from "../models/PushSubscription.js";
import { EmailLog } from "../models/EmailLog.js";
import { User } from "../models/User.js";

const TYPE_TO_PREF_KEYS = {
  LEAD_ASSIGNED: { inApp: "inAppLeadAssigned", email: "emailLeadAssigned" },
  SCHEDULED_CALL: { inApp: "inAppCallScheduled", email: "emailCallScheduled" },
  LEAD_DELETE_REQUEST: { inApp: "inAppLeadDeleteRequest", email: null },
  REVENUE_APPROVAL_PENDING: { inApp: "inAppLeadAssigned", email: "emailLeadAssigned" },
  REVENUE_APPROVAL_REMINDER: { inApp: "inAppLeadAssigned", email: "emailLeadAssigned" },
  REVENUE_APPROVED: { inApp: "inAppLeadAssigned", email: "emailLeadAssigned" },
  REVENUE_REJECTED: { inApp: "inAppLeadAssigned", email: "emailLeadAssigned" },
  REVENUE_EXPIRED: { inApp: "inAppLeadAssigned", email: "emailLeadAssigned" }
};

function getPrefKeysForType(type) {
  return TYPE_TO_PREF_KEYS[type] || { inApp: null, email: null };
}

function getMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@iqlead.local";
  if (!publicKey || !privateKey) return false;
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return true;
  } catch {
    return false;
  }
}

async function getOrCreatePrefs(userId) {
  const existing = await NotificationPreference.findOne({ where: { userId } });
  if (existing) return existing;
  return await NotificationPreference.create({ userId });
}

async function maybeCreateInApp(userId, payload, prefs) {
  const { type } = payload;
  const keys = getPrefKeysForType(type);
  if (keys.inApp && prefs && prefs[keys.inApp] === false) return null;
  return await NotificationLog.create({
    userId,
    type: payload.type,
    title: payload.title,
    message: payload.message
  });
}

async function maybeSendEmail(userId, payload, prefs) {
  const keys = getPrefKeysForType(payload.type);
  if (keys.email && prefs && prefs[keys.email] === false) return;

  const user = await User.findByPk(userId, { attributes: ["id", "email", "name"] });
  const to = user?.email;
  if (!to) return;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@iqlead.local";
  const subject = `[IQLead] ${payload.title}`;
  const body = `${payload.message}\n`;

  const log = await EmailLog.create({
    userId,
    leadId: payload.leadId || null,
    subject,
    body,
    status: "QUEUED"
  });

  const mailer = getMailer();
  if (!mailer) {
    await log.update({ status: "FAILED" }, { silent: true });
    return;
  }
  try {
    const info = await mailer.sendMail({
      from,
      to,
      subject,
      text: body
    });
    await log.update(
      { status: "SENT", providerMessageId: info?.messageId || null },
      { silent: true }
    );
  } catch {
    await log.update({ status: "FAILED" }, { silent: true });
  }
}

async function maybeSendPush(userId, payload, prefs) {
  if (prefs && prefs.pushEnabled === false) return;
  if (!configureWebPush()) return;

  const subs = await PushSubscription.findAll({
    where: { userId },
    attributes: ["id", "endpoint", "p256dh", "auth"]
  });
  if (!subs.length) return;

  const pushPayload = JSON.stringify({
    title: payload.title,
    message: payload.message,
    type: payload.type
  });

  for (const s of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth }
        },
        pushPayload
      );
    } catch (e) {
      // Remove invalid/expired subscriptions
      const code = e?.statusCode;
      if (code === 404 || code === 410) {
        try {
          await PushSubscription.destroy({ where: { id: s.id } });
        } catch {}
      }
    }
  }
}

/**
 * Create notification + deliver via email + push (desktop/mobile browsers).
 * Works even if the user is not currently logged in (email/push).
 */
export async function notifyUser(userId, payload) {
  const prefs = await getOrCreatePrefs(userId);
  await Promise.allSettled([
    maybeCreateInApp(userId, payload, prefs),
    maybeSendEmail(userId, payload, prefs),
    maybeSendPush(userId, payload, prefs)
  ]);
}

