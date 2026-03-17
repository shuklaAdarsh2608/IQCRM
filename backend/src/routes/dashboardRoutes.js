import express from "express";
import { Op } from "sequelize";
import { requireAuth } from "../middleware/authMiddleware.js";
import { Lead } from "../models/Lead.js";
import { User } from "../models/User.js";
import { ScheduledCall } from "../models/ScheduledCall.js";

/** Admin, Super Admin, Manager: see all. Team Leader: self + team. User: own only. */
async function resolveVisibleUserIds(currentUser) {
  if (["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(currentUser.role)) {
    return null; // null = no filter, see all
  }
  if (currentUser.role === "TEAM_LEADER") {
    const ses = await User.findAll({
      where: { managerId: currentUser.id, isActive: true },
      attributes: ["id"]
    });
    return [currentUser.id, ...ses.map((u) => u.id)];
  }
  return [currentUser.id];
}

const router = express.Router();

router.use(requireAuth);

router.get("/leaderboard", async (req, res, next) => {
  try {
    const { range = "monthly", date, from, to } = req.query;
    const now = date ? new Date(date) : new Date();

    let start;
    let end;

    if (range === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (range === "yesterday") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "weekly") {
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    } else if (range === "custom" && from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
      end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1);
    } else if (range === "all") {
      start = null;
      end = null;
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const where = {
      status: "WON",
      ...(start != null && end != null && { createdAt: { [Op.gte]: start, [Op.lt]: end } })
    };

    const visibleIds = await resolveVisibleUserIds(req.user);
    if (visibleIds !== null) {
      where.ownerId = { [Op.in]: visibleIds };
    }

    const leads = await Lead.findAll({
      where,
      attributes: ["ownerId", "valueAmount"]
    });

    const byUser = {};
    for (const l of leads) {
      const id = l.ownerId;
      if (!byUser[id]) byUser[id] = 0;
      byUser[id] += Number(l.valueAmount || 0);
    }

    const userIds = Object.keys(byUser).map(Number).filter(Boolean);
    if (userIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: ["id", "name"]
    });

    const leaderboard = users
      .map((u) => ({ userId: u.id, name: u.name, revenue: byUser[u.id] || 0 }))
      .sort((a, b) => b.revenue - a.revenue);

    res.json({ success: true, data: leaderboard });
  } catch (err) {
    next(err);
  }
});

router.get("/summary", async (req, res, next) => {
  try {
    const { range = "monthly", date, from, to } = req.query;
    const now = date ? new Date(date) : new Date();

    let start;
    let end;

    let where = {};

    if (range === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      where.createdAt = { [Op.gte]: start, [Op.lt]: end };
    } else if (range === "yesterday") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.createdAt = { [Op.gte]: start, [Op.lt]: end };
    } else if (range === "weekly") {
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      where.createdAt = { [Op.gte]: start, [Op.lt]: end };
    } else if (range === "date") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      where.createdAt = { [Op.gte]: start, [Op.lt]: end };
    } else if (range === "custom" && from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
      end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1);
      where.createdAt = { [Op.gte]: start, [Op.lt]: end };
    } else if (range === "all") {
      // no date filter - all time
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      where.createdAt = { [Op.gte]: start, [Op.lt]: end };
    }

    const visibleIds = await resolveVisibleUserIds(req.user);
    if (visibleIds !== null) {
      where.ownerId = { [Op.in]: visibleIds };
    }

    const newLeads = await Lead.count({ where });
    const totalRevenue = await Lead.sum("valueAmount", { where });

    // Assigned leads count (all time) - role-based visibility
    const assignedWhere = {};
    if (visibleIds !== null) assignedWhere.ownerId = { [Op.in]: visibleIds };
    const assignedLeadsCount = await Lead.count({ where: assignedWhere });

    // Won leads count (all time) - role-based visibility
    const wonWhere = { status: "WON" };
    if (visibleIds !== null) wonWhere.ownerId = { [Op.in]: visibleIds };
    const wonLeadsCount = await Lead.count({ where: wonWhere });

    // Upcoming calls count - role-based visibility
    const now = new Date();
    const callsWhere = {
      scheduledTime: { [Op.gte]: now },
      status: "PENDING"
    };
    if (visibleIds !== null) {
      callsWhere.userId = { [Op.in]: visibleIds };
    }
    const upcomingCallsCount = await ScheduledCall.count({ where: callsWhere });

    res.json({
      success: true,
      data: {
        newLeads,
        totalRevenue: Number(totalRevenue || 0),
        assignedLeadsCount,
        wonLeadsCount,
        upcomingCallsCount
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/latest-leads", async (req, res, next) => {
  try {
    const visibleIds = await resolveVisibleUserIds(req.user);
    const where = {};
    if (visibleIds !== null) {
      where.ownerId = { [Op.in]: visibleIds };
    }
    const leads = await Lead.findAll({
      where,
      limit: 5,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "firstName", "lastName", "createdAt"]
    });
    res.json({ success: true, data: leads });
  } catch (err) {
    next(err);
  }
});

export { router as dashboardRouter };

