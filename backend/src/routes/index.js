import express from "express";
import { healthRouter } from "./healthRoutes.js";
import { authRouter } from "./authRoutes.js";
import { userRouter } from "./userRoutes.js";
import { leadRouter } from "./leadRoutes.js";
import { targetRouter } from "./targetRoutes.js";
import { dashboardRouter } from "./dashboardRoutes.js";
import { notificationRouter } from "./notificationRoutes.js";
import { reportRouter } from "./reportRoutes.js";
import { chatRouter } from "./chatRoutes.js";
import { activityLogRouter } from "./activityLogRoutes.js";
import { streakApprovalRouter } from "./streakApprovalRoutes.js";
import { streakRouter } from "./streakRoutes.js";

const router = express.Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/leads", leadRouter);
router.use("/targets", targetRouter);
router.use("/dashboard", dashboardRouter);
router.use("/notifications", notificationRouter);
router.use("/reports", reportRouter);
router.use("/chats", chatRouter);
router.use("/activity-logs", activityLogRouter);
router.use("/streak-approvals", streakApprovalRouter);
router.use("/streaks", streakRouter);

export { router as apiRouter };

