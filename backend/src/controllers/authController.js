import { registerUser, loginUser } from "../services/authService.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { User } from "../models/User.js";

export async function register(req, res, next) {
  try {
    const { name, email, password, role, managerId } = req.body;
    const { user, token } = await registerUser({
      name,
      email,
      password,
      role,
      managerId
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password, forceTerminate } = req.body;
    const { user, token } = await loginUser({ email, password, forceTerminate });

    // Record login activity
    try {
      await ActivityLog.create({
        userId: user.id,
        action: "LOGIN",
        details: `Logged in from ${req.ip || "unknown IP"}`
      });
    } catch {
      // do not block login on activity log failure
    }

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    if (err.code === "SESSION_ALREADY_ACTIVE") {
      return res.status(err.status || 409).json({
        success: false,
        code: err.code,
        message: err.message
      });
    }
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const userId = req.user?.id;
    if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        user.tokenVersion = (user.tokenVersion ?? 0) + 1;
        user.hasActiveSession = false;
        await user.save();
      }
    }

    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    next(err);
  }
}

