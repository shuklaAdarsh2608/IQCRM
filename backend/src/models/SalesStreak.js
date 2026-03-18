import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./User.js";

export class SalesStreak extends Model {}

SalesStreak.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true,
      field: "user_id"
    },
    currentStreakCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "current_streak_count"
    },
    longestStreakCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "longest_streak_count"
    },
    currentStreakStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "current_streak_start_date"
    },
    lastApprovedWinDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "last_approved_win_date"
    },
    totalApprovedWins: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "total_approved_wins"
    },
    totalApprovedRevenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      field: "total_approved_revenue"
    },
    streakStatus: {
      type: DataTypes.ENUM("ACTIVE", "BROKEN"),
      allowNull: false,
      defaultValue: "BROKEN",
      field: "streak_status"
    },
    brokenAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "broken_at"
    }
  },
  {
    sequelize,
    modelName: "SalesStreak",
    tableName: "sales_streaks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

SalesStreak.belongsTo(User, { as: "user", foreignKey: "userId" });

