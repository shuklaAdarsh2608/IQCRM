import { Router } from "express";
import { getActivityLogs, exportActivityLogs } from "../controllers/activityLogController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Only SUPER_ADMIN and ADMIN can see activity logs
router.use(requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]));

router.get("/", getActivityLogs);
router.get("/export", exportActivityLogs);

export { router as activityLogRouter };

