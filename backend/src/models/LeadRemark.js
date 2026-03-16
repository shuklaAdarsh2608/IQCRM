import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { Lead } from "./Lead.js";
import { User } from "./User.js";

export class LeadRemark extends Model {}

LeadRemark.init(
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
    remark: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: "LeadRemark",
    tableName: "lead_remarks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

LeadRemark.belongsTo(Lead, { as: "lead", foreignKey: "leadId" });
LeadRemark.belongsTo(User, { as: "user", foreignKey: "userId" });

