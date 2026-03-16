import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export class LeadSource extends Model {}

LeadSource.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active"
    }
  },
  {
    sequelize,
    modelName: "LeadSource",
    tableName: "lead_sources",
    timestamps: true
  }
);

