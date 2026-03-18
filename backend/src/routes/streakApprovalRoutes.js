import express from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  listPendingApprovals,
  getApprovalById,
  getApprovalByLeadId,
  approveApproval,
  rejectApproval
} from "../controllers/streakApprovalController.js";

const router = express.Router();
router.use(requireAuth);

router.get("/pending", listPendingApprovals);
router.get("/by-lead/:leadId", getApprovalByLeadId);
router.get("/:id", getApprovalById);
router.post(
  "/:id/approve",
  [body("paymentReceived").optional().isBoolean(), body("approvalNote").optional().isString()],
  approveApproval
);
router.post(
  "/:id/reject",
  [body("rejectionNote").optional().isString()],
  rejectApproval
);

export { router as streakApprovalRouter };

