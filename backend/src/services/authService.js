import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";

export async function registerUser({ name, email, password, role = "USER", managerId = null }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const error = new Error("Email is already in use");
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    managerId
  });

  const token = signToken({
    id: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion ?? 0
  });

  return { user, token };
}

// Login with single-active-session support.
// If hasActiveSession is true and forceTerminate is not set,
// we throw a special error so the frontend can show a modal.
export async function loginUser({ email, password, forceTerminate = false }) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("User account is disabled");
    error.status = 403;
    throw error;
  }

  const hasActiveSession = user.hasActiveSession ?? false;

  if (hasActiveSession && !forceTerminate) {
    const error = new Error("Session already active");
    error.status = 409;
    error.code = "SESSION_ALREADY_ACTIVE";
    throw error;
  }

  const nextVersion = (user.tokenVersion ?? 0) + 1;
  user.tokenVersion = nextVersion;
  user.hasActiveSession = true;
  await user.save();

  const token = signToken({
    id: user.id,
    role: user.role,
    tokenVersion: nextVersion
  });

  return { user, token };
}

