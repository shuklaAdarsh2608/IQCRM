import {
  createUser,
  listUsers,
  listUsersForOptions,
  resetUserPassword,
  forceLogoutUser,
  getProfile,
  updateProfile,
  changePassword,
  deleteUserById
} from "../services/userService.js";
import { encryptSmtpPassword } from "../utils/smtpSecrets.js";
import { User } from "../models/User.js";

export async function getUsersOptions(req, res, next) {
  try {
    const users = await listUsersForOptions();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

export async function getUsers(req, res, next) {
  try {
    const users = await listUsers();
    res.json({
      success: true,
      data: users.map((u) => {
        const plain = u.get ? u.get({ plain: true }) : u;
        return {
          id: plain.id,
          name: plain.name,
          email: plain.email,
          role: plain.role,
          isActive: plain.isActive,
          managerId: plain.managerId,
          createdAt: plain.createdAt,
          smtpConfigured: !!plain.smtpPassEnc,
          smtpUser: plain.smtpUser || null
        };
      })
    });
  } catch (err) {
    next(err);
  }
}

export async function setUserSmtpController(req, res, next) {
  try {
    const { id } = req.params;
    const smtpPassword = String(req.body?.smtpPassword || "");
    const smtpUser = String(req.body?.smtpUser || "").trim();
    if (!smtpPassword.trim()) {
      return res.status(400).json({ success: false, message: "smtpPassword is required" });
    }
    const user = await User.findByPk(Number(id));
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const enc = encryptSmtpPassword(smtpPassword);
    user.smtpUser = smtpUser || user.email;
    user.smtpPassEnc = enc.encB64;
    user.smtpPassIv = enc.ivB64;
    user.smtpPassTag = enc.tagB64;
    await user.save({ silent: true });
    res.json({ success: true, data: { id: user.id, smtpConfigured: true } });
  } catch (err) {
    next(err);
  }
}

export async function setMySmtpController(req, res, next) {
  try {
    const smtpPassword = String(req.body?.smtpPassword || "");
    const smtpUser = String(req.body?.smtpUser || "").trim();
    if (!smtpPassword.trim()) {
      return res.status(400).json({ success: false, message: "smtpPassword is required" });
    }
    const user = await User.findByPk(Number(req.user.id));
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const enc = encryptSmtpPassword(smtpPassword);
    user.smtpUser = smtpUser || user.email;
    user.smtpPassEnc = enc.encB64;
    user.smtpPassIv = enc.ivB64;
    user.smtpPassTag = enc.tagB64;
    await user.save({ silent: true });
    res.json({ success: true, data: { id: user.id, smtpConfigured: true } });
  } catch (err) {
    next(err);
  }
}

export async function createUserController(req, res, next) {
  try {
    const { name, email, password, role, managerId } = req.body;
    const user = await createUser({ name, email, password, role, managerId });
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordController(req, res, next) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const user = await resetUserPassword({ userId: id, newPassword });
    res.json({
      success: true,
      data: { id: user.id }
    });
  } catch (err) {
    next(err);
  }
}

export async function forceLogoutController(req, res, next) {
  try {
    const { id } = req.params;
    await forceLogoutUser(Number(id));
    res.json({
      success: true,
      message: "User has been logged out. Their session is now invalid."
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await getProfile(req.user.id);
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const { name, email } = req.body;
    const user = await updateProfile(req.user.id, { name, email });
    res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    next(err);
  }
}

export async function changePasswordMe(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    await changePassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    next(err);
  }
}

export async function deleteUserController(req, res, next) {
  try {
    const { id } = req.params;
    const result = await deleteUserById(req.user, Number(id));
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

