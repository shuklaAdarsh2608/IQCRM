import { Op } from "sequelize";
import { Lead } from "../models/Lead.js";
import { LeadWonApproval } from "../models/LeadWonApproval.js";
import { SalesStreak } from "../models/SalesStreak.js";
import { SalesStreakLog } from "../models/SalesStreakLog.js";
import { User } from "../models/User.js";
import { addHours, toDateOnlyLocal } from "../utils/streakRules.js";
import { notifyUser } from "./notificationService.js";

export function getApprovalDeadline(wonAt) {
  return addHours(wonAt, 72);
}

export function isWithin72Hours(wonAt, now = new Date()) {
  return new Date(now).getTime() <= getApprovalDeadline(wonAt).getTime();
}

async function getOrCreateStreak(userId) {
  const existing = await SalesStreak.findOne({ where: { userId } });
  if (existing) return existing;
  return await SalesStreak.create({ userId });
}

async function logStreak({
  userId,
  leadId = null,
  approvalId = null,
  actionType,
  streakBefore,
  streakAfter,
  revenueAmount = null,
  actionBy = null,
  note = null
}) {
  await SalesStreakLog.create({
    userId,
    leadId,
    approvalId,
    actionType,
    streakBefore,
    streakAfter,
    revenueAmount,
    actionBy,
    note
  });
}

export async function createPendingWonApproval({
  leadId,
  salesUserId,
  wonAmount,
  wonAt,
  paymentExpectedBy,
  proofNote
}) {
  const lead = await Lead.findByPk(leadId);
  if (!lead) throw Object.assign(new Error("Lead not found"), { status: 404 });

  const existing = await LeadWonApproval.findOne({ where: { leadId } });
  if (existing && ["PENDING", "APPROVED"].includes(existing.approvalStatus)) {
    throw Object.assign(new Error("This lead already has a won approval record"), { status: 409 });
  }

  const wonAtDate = new Date(wonAt);
  if (Number.isNaN(wonAtDate.getTime())) throw Object.assign(new Error("Invalid wonAt"), { status: 400 });

  const amount = Number(wonAmount);
  if (!Number.isFinite(amount) || amount <= 0) throw Object.assign(new Error("wonAmount must be > 0"), { status: 400 });

  const expectedBy = new Date(paymentExpectedBy);
  if (Number.isNaN(expectedBy.getTime())) throw Object.assign(new Error("Invalid paymentExpectedBy"), { status: 400 });

  const deadline = getApprovalDeadline(wonAtDate);
  if (expectedBy.getTime() > deadline.getTime()) {
    throw Object.assign(new Error("paymentExpectedBy must be within 72 hours of wonAt"), { status: 400 });
  }

  // Set lead to WON but mark revenue as pending approval
  lead.status = "WON";
  lead.valueAmount = amount; // keep existing usage, but dashboards must only sum approved
  lead.wonAmount = amount;
  lead.wonAt = wonAtDate;
  lead.revenueApprovalStatus = "PENDING";
  lead.approvalDeadlineAt = deadline;
  lead.streakCounted = false;
  await lead.save();

  const salesUser = await User.findByPk(salesUserId, { attributes: ["id", "managerId"] });

  const approval = await LeadWonApproval.create({
    leadId,
    salesUserId,
    managerId: salesUser?.managerId || null,
    wonAmount: amount,
    wonAt: wonAtDate,
    approvalDeadlineAt: deadline,
    paymentExpectedBy: expectedBy,
    proofNote: proofNote || null,
    approvalStatus: "PENDING",
    paymentReceived: false
  });

  // Notify manager/admin that approval is pending (managerId if exists; admins handled by separate job/overview)
  if (salesUser?.managerId) {
    await notifyUser(salesUser.managerId, {
      type: "REVENUE_APPROVAL_PENDING",
      title: "Revenue approval pending",
      message: `Lead #${lead.id} (${lead.firstName} ${lead.lastName || ""}) marked WON for ₹${amount}. Approve within 72 hours.`,
      leadId: lead.id
    });
  }

  return approval;
}

function computeStreakNext(streak, approvedDateOnly) {
  const before = Number(streak.currentStreakCount || 0);
  const last = streak.lastApprovedWinDate;
  if (!last) {
    return { action: "START", before, after: 1, startDate: approvedDateOnly };
  }
  if (last === approvedDateOnly) {
    // Same day: streak count does not increase
    return { action: "SAME_DAY", before, after: before, startDate: streak.currentStreakStartDate || approvedDateOnly };
  }
  const lastDate = new Date(`${last}T00:00:00`);
  const nextDay = new Date(lastDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayOnly = toDateOnlyLocal(nextDay);
  if (nextDayOnly === approvedDateOnly) {
    return { action: "CONTINUE", before, after: before + 1, startDate: streak.currentStreakStartDate || last };
  }
  // Gap: break then restart at 1
  return { action: "BREAK_AND_RESTART", before, after: 1, startDate: approvedDateOnly };
}

export async function approveWonRevenue({ approvalId, approverUserId, approvalNote, paymentReceived }) {
  const approval = await LeadWonApproval.findByPk(approvalId);
  if (!approval) throw Object.assign(new Error("Approval not found"), { status: 404 });
  if (approval.approvalStatus !== "PENDING") {
    throw Object.assign(new Error("Only PENDING approvals can be approved"), { status: 409 });
  }
  const now = new Date();
  if (now.getTime() > new Date(approval.approvalDeadlineAt).getTime()) {
    throw Object.assign(new Error("Approval deadline expired"), { status: 409 });
  }

  approval.approvalStatus = "APPROVED";
  approval.approvedAt = now;
  approval.managerId = approverUserId;
  approval.paymentReceived = Boolean(paymentReceived);
  approval.approvalNote = approvalNote || null;
  await approval.save();

  const lead = await Lead.findByPk(approval.leadId);
  if (lead) {
    lead.revenueApprovalStatus = "APPROVED";
    lead.streakCounted = true;
    await lead.save();
  }

  const streak = await getOrCreateStreak(approval.salesUserId);
  const approvedDay = toDateOnlyLocal(approval.approvedAt);
  const next = computeStreakNext(streak, approvedDay);

  const before = Number(streak.currentStreakCount || 0);
  streak.currentStreakCount = next.after;
  streak.longestStreakCount = Math.max(Number(streak.longestStreakCount || 0), next.after);
  streak.lastApprovedWinDate = approvedDay;
  streak.totalApprovedWins = Number(streak.totalApprovedWins || 0) + 1;
  streak.totalApprovedRevenue = Number(streak.totalApprovedRevenue || 0) + Number(approval.wonAmount || 0);
  streak.streakStatus = "ACTIVE";
  streak.brokenAt = null;
  streak.currentStreakStartDate = next.startDate;
  await streak.save();

  await logStreak({
    userId: approval.salesUserId,
    leadId: approval.leadId,
    approvalId: approval.id,
    actionType: "WIN_APPROVED",
    streakBefore: before,
    streakAfter: next.after,
    revenueAmount: approval.wonAmount,
    actionBy: approverUserId,
    note: approvalNote || null
  });
  if (next.action === "START") {
    await logStreak({
      userId: approval.salesUserId,
      leadId: approval.leadId,
      approvalId: approval.id,
      actionType: "STREAK_STARTED",
      streakBefore: before,
      streakAfter: next.after,
      revenueAmount: approval.wonAmount,
      actionBy: approverUserId
    });
  } else if (next.action === "CONTINUE") {
    await logStreak({
      userId: approval.salesUserId,
      leadId: approval.leadId,
      approvalId: approval.id,
      actionType: "STREAK_CONTINUED",
      streakBefore: before,
      streakAfter: next.after,
      revenueAmount: approval.wonAmount,
      actionBy: approverUserId
    });
  } else if (next.action === "BREAK_AND_RESTART") {
    await logStreak({
      userId: approval.salesUserId,
      leadId: approval.leadId,
      approvalId: approval.id,
      actionType: "STREAK_BROKEN",
      streakBefore: before,
      streakAfter: 0,
      revenueAmount: 0,
      actionBy: approverUserId,
      note: "Gap in approved wins"
    });
  }

  await notifyUser(approval.salesUserId, {
    type: "REVENUE_APPROVED",
    title: "Revenue approved",
    message: `Lead #${approval.leadId} revenue approved. Your streak is now ${next.after}.`,
    leadId: approval.leadId
  });

  return { approval, streak };
}

export async function rejectWonRevenue({ approvalId, approverUserId, rejectionNote }) {
  const approval = await LeadWonApproval.findByPk(approvalId);
  if (!approval) throw Object.assign(new Error("Approval not found"), { status: 404 });
  if (approval.approvalStatus !== "PENDING") {
    throw Object.assign(new Error("Only PENDING approvals can be rejected"), { status: 409 });
  }
  const now = new Date();
  approval.approvalStatus = "REJECTED";
  approval.rejectedAt = now;
  approval.managerId = approverUserId;
  approval.rejectionNote = rejectionNote || null;
  await approval.save();

  const lead = await Lead.findByPk(approval.leadId);
  if (lead) {
    lead.revenueApprovalStatus = "REJECTED";
    lead.streakCounted = false;
    await lead.save();
  }

  const streak = await getOrCreateStreak(approval.salesUserId);
  const before = Number(streak.currentStreakCount || 0);
  // Reject breaks the active streak (configurable later)
  streak.currentStreakCount = 0;
  streak.streakStatus = "BROKEN";
  streak.brokenAt = now;
  await streak.save();

  await logStreak({
    userId: approval.salesUserId,
    leadId: approval.leadId,
    approvalId: approval.id,
    actionType: "WIN_REJECTED",
    streakBefore: before,
    streakAfter: 0,
    revenueAmount: approval.wonAmount,
    actionBy: approverUserId,
    note: rejectionNote || null
  });
  await logStreak({
    userId: approval.salesUserId,
    leadId: approval.leadId,
    approvalId: approval.id,
    actionType: "STREAK_BROKEN",
    streakBefore: before,
    streakAfter: 0,
    revenueAmount: 0,
    actionBy: approverUserId,
    note: "Rejected revenue"
  });

  await notifyUser(approval.salesUserId, {
    type: "REVENUE_REJECTED",
    title: "Revenue rejected",
    message: `Lead #${approval.leadId} revenue rejected. Your streak has been broken.`,
    leadId: approval.leadId
  });

  return { approval, streak };
}

export async function expireWonApprovals({ now = new Date(), systemUserId = null } = {}) {
  const expired = await LeadWonApproval.findAll({
    where: {
      approvalStatus: "PENDING",
      approvalDeadlineAt: { [Op.lt]: now }
    }
  });
  if (!expired.length) return { expired: 0 };

  for (const approval of expired) {
    approval.approvalStatus = "EXPIRED";
    await approval.save({ silent: true });

    const lead = await Lead.findByPk(approval.leadId);
    if (lead) {
      lead.revenueApprovalStatus = "EXPIRED";
      lead.streakCounted = false;
      await lead.save({ silent: true });
    }

    const streak = await getOrCreateStreak(approval.salesUserId);
    const before = Number(streak.currentStreakCount || 0);
    streak.currentStreakCount = 0;
    streak.streakStatus = "BROKEN";
    streak.brokenAt = now;
    await streak.save({ silent: true });

    await logStreak({
      userId: approval.salesUserId,
      leadId: approval.leadId,
      approvalId: approval.id,
      actionType: "WIN_EXPIRED",
      streakBefore: before,
      streakAfter: 0,
      revenueAmount: approval.wonAmount,
      actionBy: systemUserId,
      note: "Approval expired"
    });
    await logStreak({
      userId: approval.salesUserId,
      leadId: approval.leadId,
      approvalId: approval.id,
      actionType: "STREAK_BROKEN",
      streakBefore: before,
      streakAfter: 0,
      revenueAmount: 0,
      actionBy: systemUserId,
      note: "Expired approval"
    });

    await notifyUser(approval.salesUserId, {
      type: "REVENUE_EXPIRED",
      title: "Approval expired",
      message: `Lead #${approval.leadId} was not approved within 72 hours. Your streak has been broken.`,
      leadId: approval.leadId
    });
  }

  return { expired: expired.length };
}

export async function sendApprovalReminders({ now = new Date() } = {}) {
  // reminder windows: at ~48h, 24h, 6h before deadline (best-effort, idempotent per field)
  const pending = await LeadWonApproval.findAll({ where: { approvalStatus: "PENDING" } });
  for (const a of pending) {
    const deadline = new Date(a.approvalDeadlineAt);
    const msLeft = deadline.getTime() - now.getTime();
    if (msLeft <= 0) continue;

    const hoursLeft = msLeft / (60 * 60 * 1000);
    const leadId = a.leadId;

    // 48h reminder when between 47.5h and 48.5h left (rough)
    if (!a.reminded48hAt && hoursLeft <= 48 && hoursLeft > 24) {
      a.reminded48hAt = now;
      await a.save({ silent: true });
      if (a.managerId) {
        await notifyUser(a.managerId, {
          type: "REVENUE_APPROVAL_REMINDER",
          title: "Approval reminder (48h)",
          message: `Revenue approval for lead #${leadId} is pending. Deadline: ${deadline.toLocaleString()}.`,
          leadId
        });
      }
    }

    if (!a.reminded24hAt && hoursLeft <= 24 && hoursLeft > 6) {
      a.reminded24hAt = now;
      await a.save({ silent: true });
      if (a.managerId) {
        await notifyUser(a.managerId, {
          type: "REVENUE_APPROVAL_REMINDER",
          title: "Approval reminder (24h)",
          message: `Revenue approval for lead #${leadId} is pending. Deadline: ${deadline.toLocaleString()}.`,
          leadId
        });
      }
    }

    if (!a.reminded6hAt && hoursLeft <= 6) {
      a.reminded6hAt = now;
      await a.save({ silent: true });
      if (a.managerId) {
        await notifyUser(a.managerId, {
          type: "REVENUE_APPROVAL_REMINDER",
          title: "Approval reminder (6h)",
          message: `Revenue approval for lead #${leadId} is pending and expiring soon. Deadline: ${deadline.toLocaleString()}.`,
          leadId
        });
      }
    }
  }
}

