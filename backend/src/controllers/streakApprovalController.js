import { Op } from "sequelize";
import { LeadWonApproval } from "../models/LeadWonApproval.js";
import { Lead } from "../models/Lead.js";
import { User } from "../models/User.js";
import { resolveTeamUserIds, canApproveRevenue } from "../services/rbacScopeService.js";
import { approveWonRevenue, rejectWonRevenue } from "../services/streakApprovalService.js";

export async function listPendingApprovals(req, res, next) {
  try {
    if (!canApproveRevenue(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const { status = "PENDING", salesUserId, from, to } = req.query;
    const where = {};
    if (status) where.approvalStatus = status;
    if (salesUserId) where.salesUserId = Number(salesUserId);
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
        const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1);
        where.wonAt = { [Op.gte]: start, [Op.lt]: end };
      }
    }

    const visible = await resolveTeamUserIds(req.user);
    if (visible !== null && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      where.salesUserId = { [Op.in]: visible };
    }

    const approvals = await LeadWonApproval.findAll({
      where,
      order: [["approvalDeadlineAt", "ASC"]],
      include: [
        { model: Lead, as: "lead", attributes: ["id", "firstName", "lastName", "company", "revenueApprovalStatus"] },
        { model: User, as: "salesUser", attributes: ["id", "name", "email"] },
        { model: User, as: "manager", attributes: ["id", "name"] }
      ]
    });
    res.json({ success: true, data: approvals });
  } catch (err) {
    next(err);
  }
}

export async function getApprovalById(req, res, next) {
  try {
    const approval = await LeadWonApproval.findByPk(req.params.id, {
      include: [
        { model: Lead, as: "lead" },
        { model: User, as: "salesUser", attributes: ["id", "name", "email"] },
        { model: User, as: "manager", attributes: ["id", "name", "email"] }
      ]
    });
    if (!approval) return res.status(404).json({ success: false, message: "Not found" });

    // Sales user can view own; approvers can view per scope; admin/superadmin all
    if (req.user.role === "USER") {
      if (Number(approval.salesUserId) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    } else if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
      const visible = await resolveTeamUserIds(req.user);
      if (visible !== null && !visible.includes(Number(approval.salesUserId))) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    }

    res.json({ success: true, data: approval });
  } catch (err) {
    next(err);
  }
}

export async function getApprovalByLeadId(req, res, next) {
  try {
    const leadId = Number(req.params.leadId);
    if (!leadId) return res.status(400).json({ success: false, message: "Invalid lead id" });

    const approval = await LeadWonApproval.findOne({
      where: { leadId },
      include: [
        { model: Lead, as: "lead" },
        { model: User, as: "salesUser", attributes: ["id", "name", "email"] },
        { model: User, as: "manager", attributes: ["id", "name", "email"] }
      ]
    });
    if (!approval) return res.status(404).json({ success: false, message: "Not found" });

    if (req.user.role === "USER") {
      if (Number(approval.salesUserId) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    } else if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
      const visible = await resolveTeamUserIds(req.user);
      if (visible !== null && !visible.includes(Number(approval.salesUserId))) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    }

    res.json({ success: true, data: approval });
  } catch (err) {
    next(err);
  }
}

export async function approveApproval(req, res, next) {
  try {
    if (!canApproveRevenue(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const { approvalNote, paymentReceived = true } = req.body || {};
    const { approval, streak } = await approveWonRevenue({
      approvalId: req.params.id,
      approverUserId: req.user.id,
      approvalNote,
      paymentReceived
    });
    res.json({ success: true, data: { approval, streak } });
  } catch (err) {
    next(err);
  }
}

export async function rejectApproval(req, res, next) {
  try {
    if (!canApproveRevenue(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const { rejectionNote } = req.body || {};
    const { approval, streak } = await rejectWonRevenue({
      approvalId: req.params.id,
      approverUserId: req.user.id,
      rejectionNote
    });
    res.json({ success: true, data: { approval, streak } });
  } catch (err) {
    next(err);
  }
}

