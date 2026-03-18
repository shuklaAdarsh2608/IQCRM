import express from "express";
import nodemailer from "nodemailer";
import { body, validationResult } from "express-validator";
import { requireAuth } from "../middleware/authMiddleware.js";
import { EmailLog } from "../models/EmailLog.js";

const router = express.Router();
router.use(requireAuth);

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

      const userEmail = req.user?.email || process.env.SMTP_USER;
      const userName = req.user?.name || "IQLead";

      const log = await EmailLog.create({
        userId: req.user.id,
        leadId: req.body?.leadId ? Number(req.body.leadId) : null,
        subject: subject || "(no subject)",
        body: text || "",
        status: "QUEUED"
      });

      const mailer = getMailer();
      if (!mailer) {
        await log.update({ status: "FAILED" }, { silent: true });
        return res.status(500).json({ success: false, message: "SMTP is not configured" });
      }

      try {
        const info = await mailer.sendMail({
          // Hostinger: authenticated user comes from SMTP_USER, but we set From to the logged-in user (same domain).
          // If provider blocks this, fallback is to keep From as SMTP_FROM and set replyTo.
          from: `${userName} <${userEmail}>`,
          replyTo: userEmail,
          to,
          subject,
          text
        });

        await log.update(
          { status: "SENT", providerMessageId: info?.messageId || null },
          { silent: true }
        );
        return res.json({ success: true, data: { id: log.id, sent: true } });
      } catch (e) {
        await log.update({ status: "FAILED" }, { silent: true });
        return res.status(500).json({ success: false, message: e?.message || "Failed to send email" });
      }
    } catch (err) {
      next(err);
    }
  }
);

export { router as mailRouter };

