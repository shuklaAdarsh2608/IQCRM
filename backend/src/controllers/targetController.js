import { SalesTarget } from "../models/SalesTarget.js";
import { User } from "../models/User.js";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

export async function getTargets(req, res, next) {
  try {
    const { userId, month, year } = req.query;

    const where = {};
    if (MANAGER_ROLES.includes(req.user.role)) {
      if (userId) {
        where.userId = userId;
      }
    } else {
      // Non-managers can only see their own target
      where.userId = req.user.id;
    }
    if (month) where.month = month;
    if (year) where.year = year;

    const targets = await SalesTarget.findAll({
      where,
      include: [{ model: User, as: "user", attributes: ["id", "name", "role"] }],
      order: [
        ["year", "DESC"],
        ["month", "DESC"]
      ]
    });

    res.json({ success: true, data: targets });
  } catch (err) {
    next(err);
  }
}

export async function upsertTarget(req, res, next) {
  try {
    const { userId, month, year, targetRevenue } = req.body;

    if (!MANAGER_ROLES.includes(req.user.role)) {
      const error = new Error("Not authorized to set targets");
      error.status = 403;
      throw error;
    }

    if (!userId || !month || !year) {
      const error = new Error("userId, month and year are required");
      error.status = 400;
      throw error;
    }

    const user = await User.findByPk(userId);
    if (!user || !user.isActive) {
      const error = new Error("Target user not found or inactive");
      error.status = 400;
      throw error;
    }

    const numericMonth = Number(month);
    const numericYear = Number(year);
    const numericRevenue = Number(targetRevenue || 0);

    let target = await SalesTarget.findOne({
      where: { userId: user.id, month: numericMonth, year: numericYear }
    });

    if (!target) {
      target = await SalesTarget.create({
        userId: user.id,
        month: numericMonth,
        year: numericYear,
        targetLeads: 0,
        targetConversions: 0,
        targetRevenue: numericRevenue
      });
    } else {
      target.targetRevenue = numericRevenue;
      await target.save();
    }

    res.json({ success: true, data: target });
  } catch (err) {
    next(err);
  }
}

