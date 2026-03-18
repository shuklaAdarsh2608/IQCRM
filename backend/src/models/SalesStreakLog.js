import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./User.js";
import { Lead } from "./Lead.js";
import { LeadWonApproval } from "./LeadWonApproval.js";

export class SalesStreakLog extends Model {}

SalesStreakLog.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "user_id"
    },
    leadId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "lead_id"
    },
    approvalId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "approval_id"
    },
    actionType: {
      type: DataTypes.ENUM(
        "STREAK_STARTED",
        "STREAK_CONTINUED",
        "STREAK_BROKEN",
        "WIN_APPROVED",
        "WIN_REJECTED",
        "WIN_EXPIRED"
      ),
      allowNull: false,
      field: "action_type"
    },
    streakBefore: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "streak_before"
    },
    streakAfter: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "streak_after"
    },
    revenueAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "revenue_amount"
    },
    actionBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "action_by"
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: "SalesStreakLog",
    tableName: "sales_streak_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ fields: ["user_id"] }, { fields: ["action_type"] }]
  }
);

SalesStreakLog.belongsTo(User, { as: "user", foreignKey: "userId" });
SalesStreakLog.belongsTo(User, { as: "actionByUser", foreignKey: "actionBy" });
SalesStreakLog.belongsTo(Lead, { as: "lead", foreignKey: "leadId" });
SalesStreakLog.belongsTo(LeadWonApproval, { as: "approval", foreignKey: "approvalId" });

