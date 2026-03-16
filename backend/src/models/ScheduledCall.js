import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { Lead } from "./Lead.js";
import { User } from "./User.js";

export class ScheduledCall extends Model {}

ScheduledCall.init(
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
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "user_id"
    },
    scheduledTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "scheduled_time"
    },
    agenda: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM("PENDING", "COMPLETED", "CANCELLED"),
      allowNull: false,
      defaultValue: "PENDING"
    }
  },
  {
    sequelize,
    modelName: "ScheduledCall",
    tableName: "scheduled_calls",
    timestamps: true
  }
);

ScheduledCall.belongsTo(Lead, { as: "lead", foreignKey: "leadId" });
ScheduledCall.belongsTo(User, { as: "user", foreignKey: "userId" });

