import express from "express";
import nodemailer from "nodemailer";
import { body, validationResult } from "express-validator";
import { requireAuth } from "../middleware/authMiddleware.js";
import { EmailLog } from "../models/EmailLog.js";
import { User } from "../models/User.js";
import { decryptSmtpPassword } from "../utils/smtpSecrets.js";

const router = express.Router();
router.use(requireAuth);

function getMailer(authUser, authPass) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  if (!host || !authUser || !authPass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: authUser, pass: authPass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  });
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(timeoutMessage);
      err.code = "SMTP_TIMEOUT";
      reject(err);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

router.post(
  "/send",
  [
    body("to").isString().trim().isLength({ min: 3 }).withMessage("to is required"),
    body("subject").optional().isString(),
    body("body").optional().isString()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0]?.msg || "Invalid input" });
      }

      const to = String(req.body?.to || "").trim();
      const subject = String(req.body?.subject || "").trim();
      const text = String(req.body?.body || "").trim();

      const userEmail = req.user?.email || "";
      const userName = req.user?.name || "IQLead";

      const dbUser = await User.findByPk(req.user.id, {
        attributes: ["id", "email", "name", "smtpUser", "smtpPassEnc", "smtpPassIv", "smtpPassTag"]
      });
      const authUser = dbUser?.smtpUser || dbUser?.email || "";
      const authPass = decryptSmtpPassword({
        encB64: dbUser?.smtpPassEnc,
        ivB64: dbUser?.smtpPassIv,
        tagB64: dbUser?.smtpPassTag
      });

      const log = await EmailLog.create({
        userId: req.user.id,
        leadId: req.body?.leadId ? Number(req.body.leadId) : null,
        subject: subject || "(no subject)",
        body: text || "",
        status: "QUEUED"
      });

      const mailer = getMailer(authUser, authPass);
      if (!mailer) {
        await log.update({ status: "FAILED" }, { silent: true });
        return res.status(400).json({
          success: false,
          message: "SMTP is not configured for this user. Set your mailbox password in Users → SMTP."
        });
      }

      try {
        const info = await withTimeout(
          mailer.sendMail({
            from: `${userName} <${authUser}>`,
            replyTo: userEmail || authUser,
            to,
            subject,
            text
          }),
          25000,
          "SMTP request timed out. Please verify SMTP host/port and mailbox credentials."
        );

        await log.update(
          { status: "SENT", providerMessageId: info?.messageId || null },
          { silent: true }
        );
        return res.json({ success: true, data: { id: log.id, sent: true } });
      } catch (e) {
        await log.update({ status: "FAILED" }, { silent: true });
        const status = e?.code === "SMTP_TIMEOUT" ? 504 : 500;
        return res.status(status).json({ success: false, message: e?.message || "Failed to send email" });
      }
    } catch (err) {
      next(err);
    }
  }
);

export { router as mailRouter };

