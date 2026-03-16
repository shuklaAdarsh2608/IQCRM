import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./User.js";
import { Lead } from "./Lead.js";

export class ActivityLog extends Model {}

ActivityLog.init(
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
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: "ActivityLog",
    tableName: "activity_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

ActivityLog.belongsTo(User, { as: "user", foreignKey: "userId" });
ActivityLog.belongsTo(Lead, { as: "lead", foreignKey: "leadId" });

