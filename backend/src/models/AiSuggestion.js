import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { Lead } from "./Lead.js";
import { User } from "./User.js";

export class AiSuggestion extends Model {}

AiSuggestion.init(
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
    type: {
      type: DataTypes.ENUM("EMAIL", "SUMMARY", "SCORE", "FOLLOW_UP", "REPLY"),
      allowNull: false
    },
    inputContext: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "input_context"
    },
    suggestion: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: "AiSuggestion",
    tableName: "ai_suggestions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

AiSuggestion.belongsTo(Lead, { as: "lead", foreignKey: "leadId" });
AiSuggestion.belongsTo(User, { as: "user", foreignKey: "userId" });

