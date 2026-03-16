import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { Lead } from "./Lead.js";

export class LeadScore extends Model {}

LeadScore.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true,
      field: "lead_id"
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    probability: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    factors: {
      type: DataTypes.JSON,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: "LeadScore",
    tableName: "lead_scores",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

LeadScore.belongsTo(Lead, { as: "lead", foreignKey: "leadId" });

