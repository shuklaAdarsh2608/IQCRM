import { ActivityLog } from "../models/ActivityLog.js";
import { User } from "../models/User.js";
import { Lead } from "../models/Lead.js";

export async function getActivityLogs(req, res, next) {
  try {
    const { userId } = req.query;
    const where = {};
    if (userId) where.userId = userId;

    const logs = await ActivityLog.findAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email", "role"] },
        { model: Lead, as: "lead", attributes: ["id", "firstName", "lastName"] }
      ],
      order: [["id", "DESC"]],
      limit: 500
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}

export async function exportActivityLogs(req, res, next) {
  try {
    const { userId } = req.query;
    const where = {};
    if (userId) where.userId = userId;

    const logs = await ActivityLog.findAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["name", "email", "role"] },
        { model: Lead, as: "lead", attributes: ["id", "firstName", "lastName"] }
      ],
      order: [["id", "DESC"]],
      limit: 5000
    });

    const header = [
      "timestamp",
      "user_name",
      "user_email",
      "user_role",
      "action",
      "lead_id",
      "lead_name",
      "details"
    ].join(",");

    const rows = logs.map((l) =>
      [
        new Date(l.created_at || Date.now()).toISOString(),
        `"${(l.user?.name || "").replace(/"/g, '""')}"`,
        `"${(l.user?.email || "").replace(/"/g, '""')}"`,
        l.user?.role || "",
        l.action,
        l.lead?.id || "",
        `"${(`${l.lead?.firstName || ""} ${l.lead?.lastName || ""}`)
          .trim()
          .replace(/"/g, '""')}"`,
        `"${(l.details || "").replace(/"/g, '""')}"`
      ].join(",")
    );

    const csv = [header, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=activity-log.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

