import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { Lead } from "./Lead.js";
import { User } from "./User.js";

export class LeadDeleteRequest extends Model {}

LeadDeleteRequest.init(
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
    requestedBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "requested_by"
    },
    status: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING"
    },
    reviewedBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "reviewed_by"
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "reviewed_at"
    }
  },
  {
    sequelize,
    modelName: "LeadDeleteRequest",
    tableName: "lead_delete_requests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

LeadDeleteRequest.belongsTo(Lead, { as: "lead", foreignKey: "leadId" });
LeadDeleteRequest.belongsTo(User, { as: "requestedByUser", foreignKey: "requestedBy" });
LeadDeleteRequest.belongsTo(User, { as: "reviewedByUser", foreignKey: "reviewedBy" });
