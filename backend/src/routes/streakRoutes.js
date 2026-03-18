import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getMyStreak, getStreakOverview, listStreakLeads } from "../controllers/streakController.js";

const router = express.Router();
router.use(requireAuth);

router.get("/me", getMyStreak);
router.get("/overview", getStreakOverview);
router.get("/leads", listStreakLeads);

export { router as streakRouter };

