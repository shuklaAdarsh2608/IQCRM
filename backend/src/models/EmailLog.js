import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { Lead } from "./Lead.js";
import { User } from "./User.js";

export class EmailLog extends Model {}

EmailLog.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "lead_id"
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "user_id"
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("QUEUED", "SENT", "DELIVERED", "FAILED"),
      allowNull: false,
      defaultValue: "QUEUED"
    },
    providerMessageId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "provider_message_id"
    }
  },
  {
    sequelize,
    modelName: "EmailLog",
    tableName: "email_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

EmailLog.belongsTo(Lead, { as: "lead", foreignKey: "leadId" });
EmailLog.belongsTo(User, { as: "user", foreignKey: "userId" });

