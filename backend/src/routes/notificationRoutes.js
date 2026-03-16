import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { NotificationLog } from "../models/NotificationLog.js";

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

export { router as notificationRouter };

