import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { Lead } from "./Lead.js";
import { User } from "./User.js";

export class LeadAssignment extends Model {}

LeadAssignment.init(
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
    fromUserId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "from_user_id"
    },
    toUserId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "to_user_id"
    },
    assignedBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "assigned_by"
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "assigned_at"
    }
  },
  {
    sequelize,
    modelName: "LeadAssignment",
    tableName: "lead_assignments",
    timestamps: false
  }
);

LeadAssignment.belongsTo(Lead, { as: "lead", foreignKey: "leadId" });
LeadAssignment.belongsTo(User, { as: "fromUser", foreignKey: "fromUserId" });
LeadAssignment.belongsTo(User, { as: "toUser", foreignKey: "toUserId" });
LeadAssignment.belongsTo(User, { as: "assignedByUser", foreignKey: "assignedBy" });

