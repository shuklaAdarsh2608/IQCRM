import { Op } from "sequelize";
import { SalesStreak } from "../models/SalesStreak.js";
import { SalesStreakLog } from "../models/SalesStreakLog.js";
import { LeadWonApproval } from "../models/LeadWonApproval.js";
import { Lead } from "../models/Lead.js";
import { User } from "../models/User.js";
import { resolveTeamUserIds } from "../services/rbacScopeService.js";

export async function getMyStreak(req, res, next) {
  try {
    const userId = req.user.id;
    const streak =
      (await SalesStreak.findOne({ where: { userId } })) ||
      (await SalesStreak.create({ userId }));

    const pendingCount = await LeadWonApproval.count({
      where: { salesUserId: userId, approvalStatus: "PENDING" }
    });
    const expiredCount = await LeadWonApproval.count({
      where: { salesUserId: userId, approvalStatus: "EXPIRED" }
    });

    const recent = await SalesStreakLog.findAll({
      where: { userId },
      order: [["created_at", "DESC"]],
      limit: 25,
      include: [{ model: Lead, as: "lead", attributes: ["id", "firstName", "lastName", "company"] }]
    });

    res.json({
      success: true,
      data: {
        streak,
        counts: { pendingCount, expiredCount },
        recent
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getStreakOverview(req, res, next) {
  try {
    const visible = await resolveTeamUserIds(req.user);
    const userWhere = visible === null ? { isActive: true } : { id: { [Op.in]: visible }, isActive: true };

    const users = await User.findAll({ where: userWhere, attributes: ["id", "name", "role", "managerId"] });
    const userIds = users.map((u) => u.id);

    const streaks = await SalesStreak.findAll({ where: { userId: { [Op.in]: userIds } } });
    const streakByUser = Object.fromEntries(streaks.map((s) => [String(s.userId), s]));

    const pendingByUser = await LeadWonApproval.findAll({
      where: { salesUserId: { [Op.in]: userIds }, approvalStatus: "PENDING" },
      attributes: ["salesUserId", [LeadWonApproval.sequelize.fn("COUNT", LeadWonApproval.sequelize.col("id")), "cnt"]],
      group: ["salesUserId"],
      raw: true
    });
    const pendingMap = Object.fromEntries(pendingByUser.map((r) => [String(r.salesUserId), Number(r.cnt || 0)]));

    const rows = users.map((u) => {
      const s = streakByUser[String(u.id)] || null;
      return {
        userId: u.id,
        name: u.name,
        role: u.role,
        currentStreak: Number(s?.currentStreakCount || 0),
        longestStreak: Number(s?.longestStreakCount || 0),
        totalApprovedWins: Number(s?.totalApprovedWins || 0),
        totalApprovedRevenue: Number(s?.totalApprovedRevenue || 0),
        pendingApprovals: pendingMap[String(u.id)] || 0,
        streakStatus: s?.streakStatus || "BROKEN"
      };
    });

    const topPerformers = [...rows].sort((a, b) => b.currentStreak - a.currentStreak).slice(0, 10);

    res.json({
      success: true,
      data: {
        topPerformers,
        users: rows
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function listStreakLeads(req, res, next) {
  try {
    const { status, salesUserId, from, to } = req.query;
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

    if (req.user.role === "USER") {
      where.salesUserId = req.user.id;
    } else {
      const visible = await resolveTeamUserIds(req.user);
      if (visible !== null && !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
        where.salesUserId = { [Op.in]: visible };
      }
    }

    const approvals = await LeadWonApproval.findAll({
      where,
      order: [["wonAt", "DESC"]],
      include: [
        { model: Lead, as: "lead", attributes: ["id", "firstName", "lastName", "company", "revenueApprovalStatus"] },
        { model: User, as: "salesUser", attributes: ["id", "name"] }
      ]
    });
    res.json({ success: true, data: approvals });
  } catch (err) {
    next(err);
  }
}

