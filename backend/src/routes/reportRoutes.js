import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
  getPerformanceReport,
  exportPerformanceReport
} from "../controllers/reportController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/performance", getPerformanceReport);
router.get(
  "/performance/export",
  requireRole(["SUPER_ADMIN", "ADMIN", "MANAGER"]),
  exportPerformanceReport
);

export { router as reportRouter };

