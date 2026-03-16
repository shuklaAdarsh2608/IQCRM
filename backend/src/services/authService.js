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

  const token = signToken({ id: user.id, role: user.role });

  return { user, token };
}

export async function loginUser({ email, password }) {
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

  const token = signToken({ id: user.id, role: user.role });

  return { user, token };
}

