import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./User.js";

export class ReportRequest extends Model {}

ReportRequest.init(
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
      type: DataTypes.STRING(100),
      allowNull: false
    },
    filters: {
      type: DataTypes.JSON,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM("PENDING", "PROCESSING", "COMPLETED", "FAILED"),
      allowNull: false,
      defaultValue: "PENDING"
    },
    generatedFile: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "generated_file"
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "completed_at"
    }
  },
  {
    sequelize,
    modelName: "ReportRequest",
    tableName: "report_requests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

ReportRequest.belongsTo(User, { as: "user", foreignKey: "userId" });

