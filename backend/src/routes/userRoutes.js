import express from "express";
import { body } from "express-validator";
import {
  createUserController,
  getUsers,
  getUsersOptions,
  resetPasswordController,
  forceLogoutController,
  getMe,
  updateMe,
  changePasswordMe
} from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Any authenticated user can fetch options (for lead assign dropdown, etc.)
router.get("/options", requireAuth, getUsersOptions);

// Current user profile (any authenticated user)
router.get("/me", requireAuth, getMe);
router.patch(
  "/me",
  requireAuth,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("email").optional().isEmail().withMessage("Valid email required")
  ],
  updateMe
);
router.post(
  "/me/change-password",
  requireAuth,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters")
  ],
  changePasswordMe
);

// All user admin routes require SUPER_ADMIN or ADMIN
router.use(requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]));

router.get("/", getUsers);

router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEADER", "USER"])
      .withMessage("Invalid role")
  ],
  createUserController
);

router.post(
  "/:id/reset-password",
  [
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
  ],
  resetPasswordController
);

router.post("/:id/force-logout", forceLogoutController);

export { router as userRouter };

