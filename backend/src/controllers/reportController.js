import { Op } from "sequelize";
import XLSX from "xlsx";
import { Lead } from "../models/Lead.js";
import { User } from "../models/User.js";
import { SalesTarget } from "../models/SalesTarget.js";

async function resolveVisibleUserIds(currentUser) {
  if (["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
    const all = await User.findAll({
      where: { isActive: true },
      attributes: ["id"]
    });
    return all.map((u) => u.id);
  }

  if (currentUser.role === "MANAGER") {
    const tls = await User.findAll({
      where: { managerId: currentUser.id, isActive: true },
      attributes: ["id"]
    });
    const tlIds = tls.map((u) => u.id);

    const ses = await User.findAll({
      where: { managerId: { [Op.in]: tlIds }, isActive: true },
      attributes: ["id"]
    });
    return [currentUser.id, ...tlIds, ...ses.map((u) => u.id)];
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

async function buildPerformanceRows(currentUser, from, to) {
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const visibleIds = await resolveVisibleUserIds(currentUser);

  const leads = await Lead.findAll({
    where: {
      ownerId: { [Op.in]: visibleIds },
      createdAt: { [Op.gte]: start, [Op.lt]: end }
    },
    attributes: ["ownerId", "status", "valueAmount", "revenueApprovalStatus"]
  });

  const byUser = {};
  for (const l of leads) {
    const id = l.ownerId;
    if (!byUser[id]) byUser[id] = { leads: 0, won: 0, revenue: 0 };
    byUser[id].leads += 1;
    if (l.status === "WON" && l.revenueApprovalStatus === "APPROVED") {
      byUser[id].won += 1;
      byUser[id].revenue += Number(l.valueAmount || 0);
    }
  }

  const userIds = Object.keys(byUser);
  if (userIds.length === 0) {
    return [];
  }

  const users = await User.findAll({
    where: { id: { [Op.in]: userIds } },
    attributes: ["id", "name", "role"]
  });

  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const targets = await SalesTarget.findAll({
    where: { userId: { [Op.in]: userIds }, month, year },
    attributes: ["userId", "targetRevenue"]
  });

  const targetMap = {};
  for (const t of targets) {
    targetMap[t.userId] = Number(t.targetRevenue || 0);
  }

  return users.map((u) => {
    const m = byUser[u.id];
    const target = targetMap[u.id] || 0;
    return {
      userId: u.id,
      name: u.name,
      role: u.role,
      leads: m.leads,
      won: m.won,
      revenue: m.revenue,
      targetRevenue: target
    };
  });
}

export async function getPerformanceReport(req, res, next) {
  try {
    const { from, to } = req.query;
    const rows = await buildPerformanceRows(req.user, from, to);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function exportPerformanceReport(req, res, next) {
  try {
    const { from, to } = req.query;
    const rows = await buildPerformanceRows(req.user, from, to);

    const dataForSheet = rows.map((r) => ({
      User: r.name,
      Role: r.role === "USER" ? "Sales Executive" : r.role,
      Leads: r.leads,
      Won: r.won,
      Revenue: Number(r.revenue || 0),
      Target: Number(r.targetRevenue || 0)
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataForSheet);
    XLSX.utils.book_append_sheet(wb, ws, "Performance");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=\"performance-report.xlsx\""
    );

    return res.send(buffer);
  } catch (err) {
    next(err);
  }
}

