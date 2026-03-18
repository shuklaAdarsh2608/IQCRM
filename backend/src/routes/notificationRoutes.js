import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { NotificationLog } from "../models/NotificationLog.js";
import { NotificationPreference } from "../models/NotificationPreference.js";
import { PushSubscription } from "../models/PushSubscription.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const notifications = await NotificationLog.findAll({
      where: { userId: req.user.id },
      order: [["created_at", "DESC"]],
      limit: 50
    });
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

router.post("/mark-read", async (req, res, next) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: "id is required" });
    const n = await NotificationLog.findOne({ where: { id: Number(id), userId: req.user.id } });
    if (!n) return res.status(404).json({ success: false, message: "Not found" });
    n.readAt = new Date();
    await n.save({ silent: true });
    res.json({ success: true, data: { read: true } });
  } catch (err) {
    next(err);
  }
});

router.get("/prefs", async (req, res, next) => {
  try {
    const prefs =
      (await NotificationPreference.findOne({ where: { userId: req.user.id } })) ||
      (await NotificationPreference.create({ userId: req.user.id }));
    res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
});

router.put("/prefs", async (req, res, next) => {
  try {
    const allowed = [
      "inAppLeadAssigned",
      "inAppCallScheduled",
      "inAppLeadDeleteRequest",
      "emailLeadAssigned",
      "emailCallScheduled",
      "emailCallReminder",
      "pushEnabled"
    ];
    const prefs =
      (await NotificationPreference.findOne({ where: { userId: req.user.id } })) ||
      (await NotificationPreference.create({ userId: req.user.id }));
    allowed.forEach((k) => {
      if (req.body?.[k] !== undefined) prefs[k] = Boolean(req.body[k]);
    });
    await prefs.save({ silent: true });
    res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
});

router.get("/push/public-key", async (req, res) => {
  res.json({ success: true, data: { publicKey: process.env.VAPID_PUBLIC_KEY || "" } });
});

router.post("/push/subscribe", async (req, res, next) => {
  try {
    const sub = req.body;
    const endpoint = sub?.endpoint;
    const p256dh = sub?.keys?.p256dh;
    const auth = sub?.keys?.auth;
    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ success: false, message: "Invalid subscription." });
    }
    // Upsert by endpoint for user
    const existing = await PushSubscription.findOne({ where: { userId: req.user.id, endpoint } });
    if (existing) {
      existing.p256dh = p256dh;
      existing.auth = auth;
      await existing.save({ silent: true });
      return res.json({ success: true, data: { subscribed: true } });
    }
    await PushSubscription.create({ userId: req.user.id, endpoint, p256dh, auth });
    res.json({ success: true, data: { subscribed: true } });
  } catch (err) {
    next(err);
  }
});

router.post("/push/unsubscribe", async (req, res, next) => {
  try {
    const endpoint = req.body?.endpoint;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: "endpoint is required" });
    }
    await PushSubscription.destroy({ where: { userId: req.user.id, endpoint } });
    res.json({ success: true, data: { unsubscribed: true } });
  } catch (err) {
    next(err);
  }
});

export { router as notificationRouter };

