import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./User.js";

export class NotificationLog extends Model {}

NotificationLog.init(
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "read_at"
    }
  },
  {
    sequelize,
    modelName: "NotificationLog",
    tableName: "notification_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

NotificationLog.belongsTo(User, { as: "user", foreignKey: "userId" });

