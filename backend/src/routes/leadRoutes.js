import express from "express";
import { body } from "express-validator";
import {
  listLeads,
  listScheduledCalls,
  getLeadById,
  getLeadAuditLog,
  createLead,
  updateLead,
  assignLead,
  bulkAssignLeads,
  importPreview,
  importLeads,
  deleteLeadsByImport,
  deleteLead,
  listDeleteRequests,
  approveDeleteRequest,
  rejectDeleteRequest,
  listLeadRemarks,
  addLeadRemark,
  scheduleCall,
  exportLeadsToExcel
} from "../controllers/leadController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { uploadSingle } from "../config/multer.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", listLeads);
router.get("/scheduled-calls", listScheduledCalls);
router.get("/export/excel", requireRole(["SUPER_ADMIN", "ADMIN"]), exportLeadsToExcel);
router.post(
  "/bulk-assign",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  [
    body("leadIds").isArray().withMessage("leadIds must be an array"),
    body("ownerId").notEmpty().withMessage("ownerId is required").isInt({ min: 1 })
  ],
  bulkAssignLeads
);
router.post("/import/preview", requireRole(["SUPER_ADMIN", "ADMIN"]), uploadSingle, importPreview);
router.post("/import", requireRole(["SUPER_ADMIN", "ADMIN"]), uploadSingle, importLeads);
router.delete(
  "/import/:importLogId",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  deleteLeadsByImport
);
router.get("/delete-requests", requireRole(["SUPER_ADMIN"]), listDeleteRequests);
router.post("/delete-requests/:id/approve", requireRole(["SUPER_ADMIN"]), approveDeleteRequest);
router.post("/delete-requests/:id/reject", requireRole(["SUPER_ADMIN"]), rejectDeleteRequest);
router.post(
  "/",
  [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("ownerId").optional().isInt({ min: 1 })
  ],
  createLead
);
router.get("/:id/audit", requireRole(["SUPER_ADMIN", "ADMIN"]), getLeadAuditLog);
router.get("/:id", getLeadById);
router.put("/:id", updateLead);
router.delete("/:id", requireRole(["SUPER_ADMIN", "ADMIN"]), deleteLead);
router.get("/:id/remarks", listLeadRemarks);
router.post("/:id/remarks", body("remark").notEmpty().withMessage("Remark is required"), addLeadRemark);
router.post(
  "/:id/schedule-call",
  [
    body("scheduledTime").notEmpty().withMessage("scheduledTime is required"),
    body("agenda").notEmpty().withMessage("agenda is required")
  ],
  scheduleCall
);
router.patch(
  "/:id/assign",
  body("ownerId").notEmpty().withMessage("ownerId is required").isInt({ min: 1 }),
  assignLead
);

export { router as leadRouter };
