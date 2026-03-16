import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./User.js";

export class SalesTarget extends Model {}

SalesTarget.init(
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
    month: {
      type: DataTypes.TINYINT,
      allowNull: false
    },
    year: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    targetLeads: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "target_leads"
    },
    targetConversions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "target_conversions"
    },
    targetRevenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      field: "target_revenue"
    }
  },
  {
    sequelize,
    modelName: "SalesTarget",
    tableName: "sales_targets",
    timestamps: true
  }
);

SalesTarget.belongsTo(User, { as: "user", foreignKey: "userId" });

