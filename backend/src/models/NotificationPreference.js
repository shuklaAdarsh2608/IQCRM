import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./User.js";

export class NotificationPreference extends Model {}

NotificationPreference.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true,
      field: "user_id"
    },
    inAppLeadAssigned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "in_app_lead_assigned"
    },
    inAppCallScheduled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "in_app_call_scheduled"
    },
    inAppLeadDeleteRequest: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "in_app_lead_delete_request"
    },
    emailLeadAssigned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "email_lead_assigned"
    },
    emailCallScheduled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "email_call_scheduled"
    },
    emailCallReminder: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "email_call_reminder"
    },
    pushEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "push_enabled"
    }
  },
  {
    sequelize,
    modelName: "NotificationPreference",
    tableName: "notification_preferences",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

NotificationPreference.belongsTo(User, { as: "user", foreignKey: "userId" });

