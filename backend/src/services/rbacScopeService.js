import { Op } from "sequelize";
import { User } from "../models/User.js";

export async function resolveTeamUserIds(viewer) {
  const { id, role } = viewer;
  if (["SUPER_ADMIN", "ADMIN"].includes(role)) return null;
  if (role === "MANAGER") {
    const tls = await User.findAll({
      where: { managerId: id, isActive: true },
      attributes: ["id"]
    });
    const tlIds = tls.map((u) => u.id);
    const ses = await User.findAll({
      where: { managerId: { [Op.in]: tlIds }, isActive: true },
      attributes: ["id"]
    });
    return [id, ...tlIds, ...ses.map((u) => u.id)];
  }
  if (role === "TEAM_LEADER") {
    const ses = await User.findAll({
      where: { managerId: id, isActive: true },
      attributes: ["id"]
    });
    return [id, ...ses.map((u) => u.id)];
  }
  return [id];
}

export function canApproveRevenue(role) {
  return ["MANAGER", "ADMIN", "SUPER_ADMIN"].includes(role);
}

