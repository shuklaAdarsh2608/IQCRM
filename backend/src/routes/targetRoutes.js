import express from "express";
import { body } from "express-validator";
import { getTargets, upsertTarget } from "../controllers/targetController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

// All authenticated users can view targets:
// - SUPER_ADMIN / ADMIN / MANAGER: can query any userId
// - Others: controller restricts to their own userId
router.get("/", getTargets);

router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "MANAGER"]),
  [
    body("userId").notEmpty().withMessage("userId is required").isInt({ min: 1 }),
    body("month").notEmpty().withMessage("month is required").isInt({ min: 1, max: 12 }),
    body("year").notEmpty().withMessage("year is required").isInt({ min: 2000 }),
    body("targetRevenue").optional().isNumeric()
  ],
  upsertTarget
);

export { router as targetRouter };

