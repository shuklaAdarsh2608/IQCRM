import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

export async function listUsers() {
  return User.findAll({
    attributes: ["id", "name", "email", "role", "isActive", "managerId", "createdAt"],
    order: [["createdAt", "DESC"]]
  });
}

export async function listUsersForOptions(opts = {}) {
  const where = { isActive: true };
  if (opts.roles && opts.roles.length > 0) {
    where.role = opts.roles;
  }
  return User.findAll({
    where,
    attributes: ["id", "name", "role"],
    order: [["name", "ASC"]]
  });
}

export async function createUser({ name, email, password, role, managerId }) {
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
    managerId: managerId || null
  });

  return user;
}

export async function resetUserPassword({ userId, newPassword }) {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  await user.save();

  return user;
}

export async function getProfile(userId) {
  const user = await User.findByPk(userId, {
    attributes: ["id", "name", "email", "role", "createdAt"]
  });
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  return user;
}

export async function updateProfile(userId, { name, email }) {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  if (email !== undefined && email !== user.email) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      const error = new Error("Email is already in use");
      error.status = 400;
      throw error;
    }
    user.email = email;
  }
  if (name !== undefined) user.name = name;
  await user.save();
  return user;
}

export async function forceLogoutUser(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  const version = (user.tokenVersion ?? 0) + 1;
  user.tokenVersion = version;
  await user.save();
  return user;
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    const error = new Error("Current password is incorrect");
    error.status = 400;
    throw error;
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  await user.save();
  return user;
}

export async function deleteUserById(requestingUser, userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  // Prevent deleting self
  if (requestingUser.id === user.id) {
    const error = new Error("You cannot delete your own account.");
    error.status = 400;
    throw error;
  }
  // Only SUPER_ADMIN can delete users
  if (requestingUser.role !== "SUPER_ADMIN") {
    const error = new Error("Only Super Admin can delete users.");
    error.status = 403;
    throw error;
  }
  await user.destroy();
  return { id: userId };
}

