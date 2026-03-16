import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { Lead } from "./Lead.js";
import { User } from "./User.js";

export class LeadAuditLog extends Model {}

LeadAuditLog.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "lead_id"
    },
    updatedBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "updated_by"
    },
    fieldName: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: "field_name"
    },
    oldValue: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "old_value"
    },
    newValue: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "new_value"
    }
  },
  {
    sequelize,
    modelName: "LeadAuditLog",
    tableName: "lead_audit_log",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

LeadAuditLog.belongsTo(Lead, { as: "lead", foreignKey: "leadId" });
LeadAuditLog.belongsTo(User, { as: "updatedByUser", foreignKey: "updatedBy" });
