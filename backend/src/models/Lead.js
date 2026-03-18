import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./User.js";
import { LeadSource } from "./LeadSource.js";

export class Lead extends Model {}

Lead.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "first_name"
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "last_name"
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    company: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    extraData: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "extra_data"
    },
    status: {
      type: DataTypes.ENUM(
        "NEW",
        "CONTACTED",
        "QUALIFIED",
        "PROPOSAL",
        "NEGOTIATION",
        "WON",
        "LOST",
        "RESCHEDULED",
        "JUNK"
      ),
      allowNull: false,
      defaultValue: "NEW"
    },
    sourceId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "source_id"
    },
    ownerId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "owner_id"
    },
    valueCurrency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "INR",
      field: "value_currency"
    },
    valueAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      field: "value_amount"
    },
    wonAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "won_amount"
    },
    wonAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "won_at"
    },
    revenueApprovalStatus: {
      type: DataTypes.ENUM("NONE", "PENDING", "APPROVED", "REJECTED", "EXPIRED"),
      allowNull: false,
      defaultValue: "NONE",
      field: "revenue_approval_status"
    },
    approvalDeadlineAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "approval_deadline_at"
    },
    streakCounted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "streak_counted"
    },
    expectedCloseDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "expected_close_date"
    },
    rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
      comment: "1-5 star rating"
    },
    importLogId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "import_log_id"
    },
    createdBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "created_by"
    },
    updatedBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "updated_by"
    }
  },
  {
    sequelize,
    modelName: "Lead",
    tableName: "leads",
    timestamps: true
  }
);

Lead.belongsTo(User, { as: "owner", foreignKey: "ownerId" });
Lead.belongsTo(User, { as: "creator", foreignKey: "createdBy" });
Lead.belongsTo(User, { as: "updater", foreignKey: "updatedBy" });
Lead.belongsTo(LeadSource, { as: "source", foreignKey: "sourceId" });

