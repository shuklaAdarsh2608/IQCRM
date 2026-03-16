import { sequelize, testConnection } from "../config/database.js";
import { User } from "./User.js";
import { LeadSource } from "./LeadSource.js";
import { Lead } from "./Lead.js";
import { LeadRemark } from "./LeadRemark.js";
import { LeadAssignment } from "./LeadAssignment.js";
import { LeadDeleteRequest } from "./LeadDeleteRequest.js";
import { ScheduledCall } from "./ScheduledCall.js";
import { NotificationLog } from "./NotificationLog.js";
import { ActivityLog } from "./ActivityLog.js";
import { ImportLog } from "./ImportLog.js";
import { ReportRequest } from "./ReportRequest.js";
import { SalesTarget } from "./SalesTarget.js";
import { EmailLog } from "./EmailLog.js";
import { AiSuggestion } from "./AiSuggestion.js";
import { LeadScore } from "./LeadScore.js";
import { LeadAuditLog } from "./LeadAuditLog.js";
import { InternalConversation } from "./InternalConversation.js";
import { InternalChatMessage } from "./InternalChatMessage.js";

InternalConversation.hasMany(InternalChatMessage, { as: "messages", foreignKey: "conversationId" });

export async function initModels() {
  await testConnection();
  await sequelize.sync();
}

export {
  sequelize,
  User,
  LeadSource,
  Lead,
  LeadRemark,
  LeadAssignment,
  LeadDeleteRequest,
  ScheduledCall,
  NotificationLog,
  ActivityLog,
  ImportLog,
  ReportRequest,
  SalesTarget,
  EmailLog,
  AiSuggestion,
  LeadScore,
  LeadAuditLog,
  InternalConversation,
  InternalChatMessage
};

