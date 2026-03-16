import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error = new Error("Authentication required");
      error.status = 401;
      throw error;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      const error = new Error("User not found or inactive");
      error.status = 401;
      throw error;
    }

    req.user = {
      id: user.id,
      role: user.role
    };

    next();
  } catch (err) {
    err.status = err.status || 401;
    next(err);
  }
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error("Authentication required");
      error.status = 401;
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const error = new Error("Not authorized");
      error.status = 403;
      return next(error);
    }

    return next();
  };
}

