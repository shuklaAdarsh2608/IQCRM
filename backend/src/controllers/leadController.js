import { Op } from "sequelize";
import { Lead } from "../models/Lead.js";
import { LeadAssignment } from "../models/LeadAssignment.js";
import { LeadAuditLog } from "../models/LeadAuditLog.js";
import { LeadDeleteRequest } from "../models/LeadDeleteRequest.js";
import { LeadRemark } from "../models/LeadRemark.js";
import { ScheduledCall } from "../models/ScheduledCall.js";
import { ImportLog } from "../models/ImportLog.js";
import { NotificationLog } from "../models/NotificationLog.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { User } from "../models/User.js";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";

const LEAD_STATUSES = [
  // New front-end friendly statuses
  "FRESH",
  "ACTIVE",
  "SCHEDULED",
  "NO REPLY",
  "SWITCHED OFF",
  "WON",
  "LOST",
  "DEFERRED",
  "WRONG NUMBER",
  "QUALIFIED"
];

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

function escapeLike(term) {
  if (typeof term !== "string") return "";
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

const AUDIT_FIELD_LABELS = {
  title: "Designation",
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Number",
  company: "Company",
  status: "Status",
  valueAmount: "Amount",
  valueCurrency: "Currency",
  rating: "Rating",
  expectedCloseDate: "Expected close date",
  ownerId: "Assigned to",
  remark: "Comment"
};

function auditValue(val) {
  if (val == null) return "";
  const s = String(val).trim();
  return s.length > 500 ? s.slice(0, 497) + "..." : s;
}

async function logLeadAudit(leadId, updatedBy, fieldName, oldValue, newValue) {
  const label = AUDIT_FIELD_LABELS[fieldName] || fieldName;
  await LeadAuditLog.create({
    leadId,
    updatedBy,
    fieldName: label,
    oldValue: auditValue(oldValue),
    newValue: auditValue(newValue)
  });
}

export async function listLeads(req, res, next) {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      ownerId,
      poolOnly,
      search: searchQuery,
      from,
      to
    } = req.query;
    const where = {};
    if (status) where.status = status;
    // Only admin can see all leads; others only see leads assigned to them (My leads)
    if (ADMIN_ROLES.includes(req.user.role)) {
      // poolOnly: for bulk-assign, show only leads owned by current admin (their pool to assign)
      if (poolOnly === "1" || poolOnly === "true") {
        where.ownerId = req.user.id;
      } else if (ownerId) {
        where.ownerId = ownerId;
      }
    } else {
      where.ownerId = req.user.id;
    }

    // Search across name, company, email, phone, status (and extra_data as JSON text)
    const searchTerm = typeof searchQuery === "string" ? searchQuery.trim() : "";
    if (searchTerm.length > 0) {
      const escaped = escapeLike(searchTerm);
      const pattern = `%${escaped}%`;
      const { sequelize } = Lead;
      const searchConditions = [
        { firstName: { [Op.like]: pattern } },
        { lastName: { [Op.like]: pattern } },
        { email: { [Op.like]: pattern } },
        { phone: { [Op.like]: pattern } },
        { company: { [Op.like]: pattern } },
        { status: { [Op.like]: pattern } }
      ];
      // Also match inside extra_data JSON (e.g. imported column values)
      searchConditions.push({
        [Op.and]: [
          { extraData: { [Op.ne]: null } },
          sequelize.where(
            sequelize.cast(sequelize.col("Lead.extra_data"), "CHAR"),
            { [Op.like]: pattern }
          )
        ]
      });
      where[Op.and] = where[Op.and] ? [...where[Op.and], { [Op.or]: searchConditions }] : [{ [Op.or]: searchConditions }];
    }

    // Date range filter: for "My leads" (current user's leads) use assigned date; otherwise use lead createdAt
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
        const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1);

        const isMyLeadsView = Number(where.ownerId) === Number(req.user.id);
        if (isMyLeadsView) {
          // Filter by when the lead was assigned to the current user (assigned date)
          const assignments = await LeadAssignment.findAll({
            where: {
              toUserId: req.user.id,
              assignedAt: { [Op.gte]: start, [Op.lt]: end }
            },
            attributes: ["leadId"],
            raw: true
          });
          const leadIdsInRange = [...new Set(assignments.map((a) => a.leadId))];
          where.id = leadIdsInRange.length > 0 ? { [Op.in]: leadIdsInRange } : { [Op.in]: [0] };
        } else {
          // Admin viewing others: filter by lead creation date
          where.createdAt = { [Op.gte]: start, [Op.lt]: end };
        }
      }
    }

    // When searching, ignore client limit and return a large single page
    // so admin/super admin do not need to page through results.
    const requestedLimit = Number(limit) || 1;
    const rawLimit = searchTerm.length > 0 ? 1000 : requestedLimit;
    const safeLimit = Math.min(Math.max(rawLimit, 1), searchTerm.length > 0 ? 1000 : 100);
    const offset = searchTerm.length > 0 ? 0 : (Number(page) - 1) * safeLimit;
    const { count, rows } = await Lead.findAndCountAll({
      where,
      limit: safeLimit,
      offset,
      // Recently updated / assigned leads first, then newest created
      order: [
        ["updatedAt", "DESC"],
        ["createdAt", "DESC"]
      ],
      include: [
        { model: User, as: "owner", attributes: ["id", "name", "role"] },
        { model: User, as: "creator", attributes: ["id", "name"] }
      ]
    });

    // Attach latest remark per lead for list (e.g. Comment column for limited view)
    const leadIds = rows.map((r) => r.id);
    let latestRemarkByLeadId = {};
    if (leadIds.length > 0) {
      const { sequelize } = LeadRemark;
      const remarks = await LeadRemark.findAll({
        where: { leadId: { [Op.in]: leadIds } },
        attributes: ["leadId", "remark"],
        order: [[sequelize.literal("LeadRemark.created_at"), "DESC"]]
      });
      remarks.forEach((r) => {
        if (latestRemarkByLeadId[r.leadId] === undefined) {
          latestRemarkByLeadId[r.leadId] = r.remark;
        }
      });
    }
    const data = rows.map((row) => {
      const plain = row.get ? row.get({ plain: true }) : row;
      plain.latestRemark = latestRemarkByLeadId[row.id] || null;
      return plain;
    });

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: safeLimit,
        total: count,
        totalPages: Math.max(1, Math.ceil(count / safeLimit))
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getLeadById(req, res, next) {
  try {
    const lead = await Lead.findByPk(req.params.id, {
      include: [
        { model: User, as: "owner", attributes: ["id", "name", "email"] },
        { model: User, as: "creator", attributes: ["id", "name"] }
      ]
    });
    if (!lead) {
      const error = new Error("Lead not found");
      error.status = 404;
      throw error;
    }
    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
}

export async function deleteLead(req, res, next) {
  try {
    const lead = await Lead.findByPk(req.params.id, {
      include: [{ model: User, as: "owner", attributes: ["id", "name"] }]
    });
    if (!lead) {
      const error = new Error("Lead not found");
      error.status = 404;
      throw error;
    }
    if (req.user.role === "SUPER_ADMIN") {
      await lead.destroy();
      try {
        await ActivityLog.create({
          userId: req.user.id,
          leadId: lead.id,
          action: "LEAD_DELETED",
          details: "Lead deleted"
        });
      } catch {}
      return res.json({ success: true, data: { deleted: true }, message: "Lead deleted." });
    }
    if (req.user.role === "ADMIN") {
      const existing = await LeadDeleteRequest.findOne({
        where: { leadId: lead.id, status: "PENDING" }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "A delete request for this lead is already pending."
        });
      }
      const request = await LeadDeleteRequest.create({
        leadId: lead.id,
        requestedBy: req.user.id,
        status: "PENDING"
      });
      const requester = await User.findByPk(req.user.id, { attributes: ["name"] });
      const superAdmins = await User.findAll({
        where: { role: "SUPER_ADMIN", isActive: true },
        attributes: ["id"]
      });
      const title = "Lead delete requested";
      const message = `${requester?.name || "Admin"} requested to delete lead #${lead.id} (${lead.firstName} ${lead.lastName}). Approve or reject in Pending delete requests.`;
      for (const sa of superAdmins) {
        await NotificationLog.create({
          userId: sa.id,
          type: "LEAD_DELETE_REQUEST",
          title,
          message
        });
      }
      return res.status(202).json({
        success: true,
        data: { requestId: request.id, pending: true },
        message: "Delete request sent to Super Admin for approval."
      });
    }
    const error = new Error("Not authorized to delete leads");
    error.status = 403;
    throw error;
  } catch (err) {
    next(err);
  }
}

export async function listDeleteRequests(req, res, next) {
  try {
    const requests = await LeadDeleteRequest.findAll({
      where: { status: "PENDING" },
      order: [["created_at", "DESC"]],
      include: [
        { model: Lead, as: "lead", attributes: ["id", "firstName", "lastName", "company", "email"] },
        { model: User, as: "requestedByUser", attributes: ["id", "name", "email"] }
      ]
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
}

export async function approveDeleteRequest(req, res, next) {
  try {
    const request = await LeadDeleteRequest.findByPk(req.params.id, {
      include: [{ model: Lead, as: "lead" }]
    });
    if (!request || request.status !== "PENDING") {
      const error = new Error("Delete request not found or already processed");
      error.status = 404;
      throw error;
    }
    await request.lead.destroy();
    res.json({ success: true, data: { deleted: true }, message: "Lead deleted." });
  } catch (err) {
    next(err);
  }
}

export async function rejectDeleteRequest(req, res, next) {
  try {
    const request = await LeadDeleteRequest.findByPk(req.params.id);
    if (!request || request.status !== "PENDING") {
      const error = new Error("Delete request not found or already processed");
      error.status = 404;
      throw error;
    }
    request.status = "REJECTED";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save({ silent: true });
    res.json({ success: true, data: { rejected: true }, message: "Delete request rejected." });
  } catch (err) {
    next(err);
  }
}

async function resolveVisibleUserIdsForCalls(role, userId) {
  if (["SUPER_ADMIN", "ADMIN"].includes(role)) {
    return null;
  }
  if (role === "MANAGER") {
    const tls = await User.findAll({
      where: { managerId: userId, isActive: true },
      attributes: ["id"]
    });
    const tlIds = tls.map((u) => u.id);
    const ses = await User.findAll({
      where: { managerId: { [Op.in]: tlIds }, isActive: true },
      attributes: ["id"]
    });
    return [userId, ...tlIds, ...ses.map((u) => u.id)];
  }
  if (role === "TEAM_LEADER") {
    const ses = await User.findAll({
      where: { managerId: userId, isActive: true },
      attributes: ["id"]
    });
    return [userId, ...ses.map((u) => u.id)];
  }
  return [userId];
}

export async function listScheduledCalls(req, res, next) {
  try {
    const { from, to } = req.query;
    const now = new Date();
    const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const where = {
      scheduledTime: { [Op.gte]: start, [Op.lt]: end },
      status: "PENDING"
    };

    const visibleIds = await resolveVisibleUserIdsForCalls(req.user.role, req.user.id);
    if (visibleIds !== null) {
      where.userId = { [Op.in]: visibleIds };
    }

    const calls = await ScheduledCall.findAll({
      where,
      order: [["scheduledTime", "ASC"]],
      include: [
        { model: Lead, as: "lead", attributes: ["id", "firstName", "lastName", "company"] },
        { model: User, as: "user", attributes: ["id", "name", "email"] }
      ]
    });

    res.json({ success: true, data: calls });
  } catch (err) {
    next(err);
  }
}

export async function scheduleCall(req, res, next) {
  try {
    const { id } = req.params;
    const { scheduledTime, agenda } = req.body;

    const lead = await Lead.findByPk(id);
    if (!lead) {
      const error = new Error("Lead not found");
      error.status = 404;
      throw error;
    }

    if (!scheduledTime) {
      const error = new Error("scheduledTime is required");
      error.status = 400;
      throw error;
    }

    const when = new Date(scheduledTime);
    if (Number.isNaN(when.getTime())) {
      const error = new Error("Invalid scheduledTime");
      error.status = 400;
      throw error;
    }

    const call = await ScheduledCall.create({
      leadId: lead.id,
      userId: req.user.id,
      scheduledTime: when,
      agenda: agenda || null
    });

    const managers = await User.findAll({
      where: { role: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEADER"], isActive: true },
      attributes: ["id"]
    });

    const title = "New call scheduled";
    const message = `Call for lead #${lead.id} (${lead.firstName} ${lead.lastName || ""}) on ${when.toLocaleString()} - ${agenda || "No agenda"}`;

    for (const m of managers) {
      await NotificationLog.create({
        userId: m.id,
        type: "SCHEDULED_CALL",
        title,
        message
      });
    }

    res.status(201).json({ success: true, data: call });
  } catch (err) {
    next(err);
  }
}

export async function exportLeadsToExcel(req, res, next) {
  try {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      const error = new Error("Forbidden");
      error.status = 403;
      throw error;
    }
    const { status, statuses } = req.query;
    const where = {};
    if (status && LEAD_STATUSES.includes(status)) {
      where.status = status;
    } else if (statuses) {
      const list = typeof statuses === "string" ? statuses.split(",").map((s) => s.trim()) : [].concat(statuses || []);
      const allowed = list.filter((s) => LEAD_STATUSES.includes(s));
      if (allowed.length > 0) where.status = { [Op.in]: allowed };
    }
    const leads = await Lead.findAll({
      where,
      order: [["createdAt", "DESC"]],
      include: [
        { model: User, as: "owner", attributes: ["id", "name"] }
      ]
    });
    const leadIds = leads.map((l) => l.id);
    const { sequelize } = LeadRemark;
    const remarksList = leadIds.length
      ? await LeadRemark.findAll({
          where: { leadId: { [Op.in]: leadIds } },
          order: [["leadId"], [sequelize.literal("LeadRemark.created_at"), "ASC"]]
        })
      : [];
    const remarksByLeadId = remarksList.reduce((acc, r) => {
      const id = r.leadId;
      if (!acc[id]) acc[id] = [];
      acc[id].push(r.remark);
      return acc;
    }, {});

    const rows = leads.map((lead) => {
      const remarks = remarksByLeadId[lead.id];
      const remarksText = remarks && remarks.length ? remarks.join(" | ") : "";
      const amount =
        lead.valueAmount != null && Number(lead.valueAmount) > 0
          ? `₹ ${Number(lead.valueAmount).toLocaleString("en-IN")}`
          : "";
      return {
        "Lead ID": lead.id,
        Name: [lead.firstName, lead.lastName].filter(Boolean).join(" "),
        "Company name": lead.company || "",
        Email: lead.email || "",
        Remarks: remarksText,
        Status: lead.status || "",
        "Assigned user": (lead.owner && lead.owner.name) ? lead.owner.name : "",
        Amount: amount
      };
    });
    if (rows.length === 0) {
      rows.push({
        "Lead ID": "",
        Name: "",
        "Company name": "",
        Email: "",
        Remarks: "",
        Status: "",
        "Assigned user": "",
        Amount: ""
      });
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const filename = `leads_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

export async function getLeadAuditLog(req, res, next) {
  try {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      const error = new Error("Forbidden");
      error.status = 403;
      throw error;
    }
    const leadId = req.params.id;
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      const error = new Error("Lead not found");
      error.status = 404;
      throw error;
    }
    const logs = await LeadAuditLog.findAll({
      where: { leadId },
      order: [["createdAt", "DESC"]],
      include: [{ model: User, as: "updatedByUser", attributes: ["id", "name"] }]
    });
    const data = logs.map((log) => ({
      id: log.id,
      fieldName: log.fieldName,
      oldValue: log.oldValue,
      newValue: log.newValue,
      updatedBy: log.updatedByUser ? { id: log.updatedByUser.id, name: log.updatedByUser.name } : null,
      createdAt: log.createdAt
    }));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listLeadRemarks(req, res, next) {
  try {
    const leadId = req.params.id;

    const where = { leadId };
    // When a lead is reassigned, the new owner should not see old remarks by default.
    // Apply this rule only when the viewer is the CURRENT owner and is not an admin role.
    const lead = await Lead.findByPk(leadId, { attributes: ["id", "ownerId"] });
    if (!lead) {
      const error = new Error("Lead not found");
      error.status = 404;
      throw error;
    }
    const isAdminViewer = ADMIN_ROLES.includes(req.user.role);
    const isCurrentOwnerViewing = lead.ownerId != null && Number(lead.ownerId) === Number(req.user.id);
    if (!isAdminViewer && isCurrentOwnerViewing) {
      const lastAssignment = await LeadAssignment.findOne({
        where: { leadId, toUserId: req.user.id },
        order: [["assigned_at", "DESC"]]
      });
      if (lastAssignment) {
        // LeadRemark uses created_at as the timestamp column
        where.created_at = { [Op.gte]: lastAssignment.assignedAt };
      }
    }

    const remarks = await LeadRemark.findAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "name"] }
      ],
      order: [["created_at", "DESC"]]
    });
    res.json({ success: true, data: remarks });
  } catch (err) {
    next(err);
  }
}

export async function addLeadRemark(req, res, next) {
  try {
    const leadId = req.params.id;
    const { remark } = req.body;
    if (!remark || !remark.trim()) {
      const error = new Error("Remark is required");
      error.status = 400;
      throw error;
    }
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      const error = new Error("Lead not found");
      error.status = 404;
      throw error;
    }
    const remarkText = remark.trim();
    const newRemark = await LeadRemark.create({
      leadId,
      userId: req.user.id,
      remark: remarkText
    });
    await logLeadAudit(leadId, req.user.id, "remark", "", remarkText);
    res.status(201).json({ success: true, data: newRemark });
  } catch (err) {
    next(err);
  }
}


export async function createLead(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      title,
      firstName,
      lastName,
      email,
      phone,
      company,
      status = "FRESH",
      sourceId,
      ownerId,
      valueCurrency = "INR",
      valueAmount = 0,
      expectedCloseDate
    } = req.body;

    if (!firstName?.trim()) {
      const error = new Error("First name is required");
      error.status = 400;
      throw error;
    }

    const owner = ownerId ? await User.findByPk(ownerId) : await User.findByPk(userId);
    if (!owner?.isActive) {
      const error = new Error("Owner user not found or inactive");
      error.status = 400;
      throw error;
    }

    const lead = await Lead.create({
      title: title || null,
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      company: company?.trim() || null,
      status: LEAD_STATUSES.includes(status) ? status : "FRESH",
      sourceId: sourceId || null,
      ownerId: owner.id,
      valueCurrency: valueCurrency || "INR",
      valueAmount: Number(valueAmount) || 0,
      expectedCloseDate: expectedCloseDate || null,
      createdBy: userId,
      updatedBy: userId
    });

    const withOwner = await Lead.findByPk(lead.id, {
      include: [{ model: User, as: "owner", attributes: ["id", "name"] }]
    });
    // Log lead creation
    try {
      await ActivityLog.create({
        userId,
        leadId: lead.id,
        action: "LEAD_CREATED",
        details: `Lead created: ${lead.firstName || ""} ${lead.lastName || ""}`.trim()
      });
    } catch {}
    res.status(201).json({ success: true, data: withOwner });
  } catch (err) {
    next(err);
  }
}

export async function updateLead(req, res, next) {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) {
      const error = new Error("Lead not found");
      error.status = 404;
      throw error;
    }
    const userId = req.user.id;
    const allowed = [
      "title",
      "firstName",
      "lastName",
      "email",
      "phone",
      "company",
      "status",
      "sourceId",
      "valueCurrency",
      "valueAmount",
      "expectedCloseDate",
      "rating"
    ];
    const previous = {};
    for (const key of allowed) {
      previous[key] = lead[key] != null ? lead[key] : "";
    }
    previous.ownerId = lead.ownerId;

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === "rating") {
          const v = Number(req.body.rating);
          lead.rating = Number.isInteger(v) && v >= 1 && v <= 5 ? v : null;
        } else {
          lead[key] = req.body[key];
        }
      }
    }
    if (req.body.ownerId !== undefined) {
      const owner = await User.findByPk(req.body.ownerId);
      if (!owner?.isActive) {
        const error = new Error("Owner user not found or inactive");
        error.status = 400;
        throw error;
      }
      lead.ownerId = owner.id;
    }
    lead.updatedBy = userId;
    await lead.save();

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        const oldVal = previous[key];
        const newVal = lead[key];
        if (String(oldVal ?? "") !== String(newVal ?? "")) {
          const displayOld = key === "valueAmount" && oldVal != null ? `₹ ${Number(oldVal).toLocaleString("en-IN")}` : (oldVal ?? "");
          const displayNew = key === "valueAmount" && newVal != null ? `₹ ${Number(newVal).toLocaleString("en-IN")}` : (newVal ?? "");
          await logLeadAudit(lead.id, userId, key, displayOld, displayNew);
        }
      }
    }
    if (req.body.ownerId !== undefined && previous.ownerId !== lead.ownerId) {
      const [oldOwner, newOwner] = await Promise.all([
        previous.ownerId ? User.findByPk(previous.ownerId, { attributes: ["name"] }) : null,
        User.findByPk(lead.ownerId, { attributes: ["name"] })
      ]);
      await logLeadAudit(lead.id, userId, "ownerId", oldOwner?.name ?? "—", newOwner?.name ?? "—");
    }

    const updated = await Lead.findByPk(lead.id, {
      include: [{ model: User, as: "owner", attributes: ["id", "name"] }]
    });
    // Log lead update summary
    try {
      await ActivityLog.create({
        userId,
        leadId: lead.id,
        action: "LEAD_UPDATED",
        details: "Lead details updated"
      });
    } catch {}
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function assignLead(req, res, next) {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) {
      const error = new Error("Lead not found");
      error.status = 404;
      throw error;
    }
    const { ownerId } = req.body;
    if (!ownerId) {
      const error = new Error("ownerId is required");
      error.status = 400;
      throw error;
    }
    const toUser = await User.findByPk(ownerId);
    if (!toUser?.isActive) {
      const error = new Error("Assignee user not found or inactive");
      error.status = 400;
      throw error;
    }
    const fromUserId = lead.ownerId;
    if (fromUserId === toUser.id) {
      return res.json({ success: true, data: lead, message: "Lead already assigned to this user" });
    }
    const oldOwner = fromUserId ? await User.findByPk(fromUserId, { attributes: ["name"] }) : null;

    // When a lead is reassigned, treat it as fresh: reset status to FRESH
    const oldStatus = lead.status;
    lead.ownerId = toUser.id;
    lead.status = "FRESH";
    lead.updatedBy = req.user.id;
    await lead.save();
    await LeadAssignment.create({
      leadId: lead.id,
      fromUserId: fromUserId || null,
      toUserId: toUser.id,
      assignedBy: req.user.id
    });
    await logLeadAudit(lead.id, req.user.id, "ownerId", oldOwner?.name ?? "—", toUser.name);
    if (oldStatus !== "FRESH") {
      await logLeadAudit(lead.id, req.user.id, "status", oldStatus, "FRESH");
    }
    const updated = await Lead.findByPk(lead.id, {
      include: [{ model: User, as: "owner", attributes: ["id", "name"] }]
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignLeads(req, res, next) {
  try {
    const { leadIds, ownerId } = req.body;
    if (!Array.isArray(leadIds) || !leadIds.length || !ownerId) {
      const error = new Error("leadIds (array) and ownerId are required");
      error.status = 400;
      throw error;
    }
    const toUser = await User.findByPk(ownerId);
    if (!toUser?.isActive) {
      const error = new Error("Assignee user not found or inactive");
      error.status = 400;
      throw error;
    }
    const results = { assigned: 0, skipped: 0, errors: [] };
    for (const id of leadIds) {
      try {
        const lead = await Lead.findByPk(id);
        if (!lead) {
          results.errors.push({ leadId: id, message: "Lead not found" });
          results.skipped++;
          continue;
        }
        if (lead.ownerId === toUser.id) {
          results.skipped++;
          continue;
        }
        const fromUserId = lead.ownerId;
        const oldStatus = lead.status;
        lead.ownerId = toUser.id;
        lead.status = "FRESH";
        lead.updatedBy = req.user.id;
        await lead.save();
        await LeadAssignment.create({
          leadId: lead.id,
          fromUserId: fromUserId || null,
          toUserId: toUser.id,
          assignedBy: req.user.id
        });
        if (oldStatus !== "FRESH") {
          await logLeadAudit(lead.id, req.user.id, "status", oldStatus, "FRESH");
        }
        results.assigned++;
      } catch (e) {
        results.errors.push({ leadId: id, message: e.message });
        results.skipped++;
      }
    }
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

function parseImportFile(file) {
  const name = (file.originalname || "").toLowerCase();
  const isExcel =
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (isExcel) {
    const wb = XLSX.read(file.buffer, { type: "buffer", cellDates: true });
    const firstSheet = wb.SheetNames[0] ? wb.Sheets[wb.SheetNames[0]] : null;
    if (!firstSheet) return [];
    return XLSX.utils.sheet_to_json(firstSheet, { defval: "", raw: false });
  }
  const csv = file.buffer.toString("utf-8");
  return parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });
}

function extractHeaders(file) {
  const name = (file.originalname || "").toLowerCase();
  const isExcel =
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (isExcel) {
    const wb = XLSX.read(file.buffer, { type: "buffer", cellDates: true });
    const firstSheet = wb.SheetNames[0] ? wb.Sheets[wb.SheetNames[0]] : null;
    if (!firstSheet) return [];
    const rows = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
      range: 0,
      raw: false
    });
    const headerRow = Array.isArray(rows[0]) ? rows[0] : [];
    return headerRow
      .map((h) => (typeof h === "string" ? h.trim() : ""))
      .filter((h) => h);
  }
  const csv = file.buffer.toString("utf-8");
  const [firstLine] = csv.split(/\r?\n/);
  if (!firstLine) return [];
  const parsed = parse(firstLine, {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true
  });
  const headerRow = parsed[0] || [];
  return headerRow
    .map((h) => (typeof h === "string" ? h.trim() : ""))
    .filter((h) => h);
}

/** Get value from row using column map or common keys */
function getRowVal(row, columnMap, fieldKey, fallbackKeys = []) {
  const fileHeader = columnMap && columnMap[fieldKey];
  if (fileHeader && row[fileHeader] !== undefined && row[fileHeader] !== null && String(row[fileHeader]).trim() !== "") {
    return String(row[fileHeader]).trim();
  }
  for (const k of fallbackKeys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
      return String(row[k]).trim();
    }
  }
  return "";
}

export async function importPreview(req, res, next) {
  try {
    if (!req.file?.buffer) {
      const error = new Error("CSV or Excel file is required");
      error.status = 400;
      throw error;
    }
    let headers = [];
    try {
      headers = extractHeaders(req.file);
    } catch (e) {
      const error = new Error("Invalid file: " + (e.message || "parse error"));
      error.status = 400;
      throw error;
    }
    res.json({ success: true, data: { headers } });
  } catch (err) {
    next(err);
  }
}

export async function importLeads(req, res, next) {
  try {
    if (!req.file?.buffer) {
      const error = new Error("CSV or Excel file is required");
      error.status = 400;
      throw error;
    }
    const ownerId = req.body.ownerId ? Number(req.body.ownerId) : req.user.id;
    const assignUser = await User.findByPk(ownerId);
    if (!assignUser?.isActive) {
      const error = new Error("Assign user not found or inactive");
      error.status = 400;
      throw error;
    }
    let columnMap = {};
    try {
      if (req.body.columnMap && typeof req.body.columnMap === "string") {
        columnMap = JSON.parse(req.body.columnMap);
      } else if (req.body.columnMap && typeof req.body.columnMap === "object") {
        columnMap = req.body.columnMap;
      }
    } catch {
      // ignore invalid JSON
    }
    let rows;
    try {
      rows = parseImportFile(req.file);
    } catch (e) {
      const error = new Error("Invalid file: " + (e.message || "parse error"));
      error.status = 400;
      throw error;
    }
    const totalRows = rows.length;
    let successRows = 0;
    let failedRows = 0;
    const log = await ImportLog.create({
      userId: req.user.id,
      filename: req.file.originalname || "import",
      totalRows,
      successRows: 0,
      failedRows: 0,
      status: "PENDING"
    });
    const errors = [];
    const mappedHeaders = new Set(
      Object.values(columnMap || {}).filter((h) => typeof h === "string" && h.trim() !== "")
    );
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const first_name = getRowVal(row, columnMap, "first_name", ["first_name", "firstName", "First Name", "FIRST NAME"]) ||
        (row.first_name ?? row.firstName ?? row["First Name"] ?? row["FIRST NAME"] ?? "").toString().trim();
      const last_name = getRowVal(row, columnMap, "last_name", ["last_name", "lastName", "Last Name", "LAST NAME"]) ||
        (row.last_name ?? row.lastName ?? row["Last Name"] ?? row["LAST NAME"] ?? "").toString().trim();
      const title = getRowVal(row, columnMap, "designation", ["title", "designation", "Title", "Designation"]) ||
        (row.title ?? row.designation ?? row["Title"] ?? row["Designation"] ?? "").toString().trim();
      const company = getRowVal(row, columnMap, "company", ["company", "Company"]) ||
        (row.company ?? row["Company"] ?? "").toString().trim();
      const phone = getRowVal(row, columnMap, "number", ["phone", "number", "Phone", "NUMBER"]) ||
        (row.phone ?? row.number ?? row["Phone"] ?? row["NUMBER"] ?? "").toString().trim();
      const email = getRowVal(row, columnMap, "mail_id", ["email", "mail_id", "Email", "MAIL ID"]) ||
        (row.email ?? row.mail_id ?? row["Email"] ?? row["MAIL ID"] ?? "").toString().trim();
      const statusVal = getRowVal(row, columnMap, "status", ["status", "Status", "Fresh"]) ||
        (row.status ?? row["Status"] ?? row.Fresh ?? "").toString().trim();
      const commentVal = getRowVal(row, columnMap, "comment", ["comment", "Comment", "COMMENT"]) ||
        (row.comment ?? row["Comment"] ?? row["COMMENT"] ?? "").toString().trim();
      const status = statusVal && LEAD_STATUSES.includes(statusVal.toUpperCase())
        ? statusVal.toUpperCase()
        : (statusVal.toLowerCase() === "fresh" ? "FRESH" : "FRESH");
      // Import all rows; use placeholder for missing first name so admin can edit or delete later
      const firstNameVal = (first_name && first_name.trim()) ? first_name.trim() : "—";
      // Build extra_data from any unmapped headers so admin can see custom columns later
      const extraData = {};
      Object.entries(row).forEach(([key, value]) => {
        if (value === undefined || value === null || String(value).trim() === "") return;
        if (mappedHeaders.has(key)) return;
        // also skip common known keys we already mapped via fallbacks
        const normalized = String(key).toLowerCase();
        const knownKeys = [
          "first_name",
          "firstname",
          "first name",
          "last_name",
          "lastname",
          "last name",
          "email",
          "email address",
          "phone",
          "phone number",
          "number",
          "title",
          "job title",
          "designation",
          "company",
          "company name",
          "status",
          "fresh",
          "comment",
          "remarks"
        ];
        if (knownKeys.includes(normalized)) return;
        extraData[key] = String(value).trim();
      });
      try {
        // Skip duplicate leads by email or phone (do not import duplicates)
        if ((email && email.length > 0) || (phone && phone.length > 0)) {
          const existing = await Lead.findOne({
            where: {
              [Op.or]: [
                email && email.length > 0 ? { email } : null,
                phone && phone.length > 0 ? { phone } : null
              ].filter(Boolean)
            }
          });
          if (existing) {
            failedRows++;
            errors.push({
              row: i + 2,
              message: "Duplicate lead (same email or phone already exists)"
            });
            continue;
          }
        }

        const lead = await Lead.create({
          title: title || null,
          firstName: firstNameVal,
          lastName: last_name || null,
          email: email || null,
          phone: phone || null,
          company: company || null,
          status,
          sourceId: null,
          ownerId: assignUser.id,
          valueCurrency: "INR",
          valueAmount: 0,
          expectedCloseDate: null,
          createdBy: req.user.id,
          updatedBy: req.user.id,
          extraData: Object.keys(extraData).length ? extraData : null,
          importLogId: log.id
        });
        if (commentVal) {
          await LeadRemark.create({
            leadId: lead.id,
            userId: req.user.id,
            remark: commentVal
          });
        }
        successRows++;
      } catch (e) {
        failedRows++;
        errors.push({ row: i + 2, message: e.message || "Create failed" });
      }
    }
    log.successRows = successRows;
    log.failedRows = failedRows;
    log.status = failedRows === totalRows ? "FAILED" : "COMPLETED";
    await log.save();
    res.status(201).json({
      success: true,
      data: {
        importLogId: log.id,
        totalRows,
        successRows,
        failedRows,
        status: log.status,
        errors: errors.slice(0, 50)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteLeadsByImport(req, res, next) {
  try {
    const importLogId = Number(req.params.importLogId);
    if (!importLogId || Number.isNaN(importLogId)) {
      const error = new Error("Valid importLogId is required");
      error.status = 400;
      throw error;
    }

    const log = await ImportLog.findByPk(importLogId);
    if (!log) {
      const error = new Error("Import log not found");
      error.status = 404;
      throw error;
    }

    const count = await Lead.count({ where: { importLogId } });
    await Lead.destroy({ where: { importLogId } });

    res.json({
      success: true,
      data: {
        importLogId,
        deletedLeads: count
      }
    });
  } catch (err) {
    next(err);
  }
}
