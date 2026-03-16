import express from "express";
import { Op } from "sequelize";
import { requireAuth } from "../middleware/authMiddleware.js";
import { Lead } from "../models/Lead.js";

const router = express.Router();

router.use(requireAuth);

router.get("/summary", async (req, res, next) => {
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
    } else if (range === "date") {
      // exact single day based on provided date
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (range === "custom" && from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
      // include full 'to' day
      end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1);
    } else {
      // monthly (default)
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const where = {
      createdAt: {
        [Op.gte]: start,
        [Op.lt]: end
      }
    };

    // Admins see all, others only their own leads
    if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
      where.ownerId = req.user.id;
    }

    const newLeads = await Lead.count({ where });
    const totalRevenue = await Lead.sum("valueAmount", { where });

    res.json({
      success: true,
      data: {
        newLeads,
        totalRevenue: Number(totalRevenue || 0)
      }
    });
  } catch (err) {
    next(err);
  }
});

export { router as dashboardRouter };

