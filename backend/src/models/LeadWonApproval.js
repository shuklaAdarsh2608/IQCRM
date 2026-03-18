import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { Lead } from "./Lead.js";
import { User } from "./User.js";

export class LeadWonApproval extends Model {}

LeadWonApproval.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "lead_id",
      unique: true
    },
    salesUserId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "sales_user_id"
    },
    managerId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "manager_id"
    },
    wonAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "won_amount"
    },
    wonAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "won_at"
    },
    approvalDeadlineAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "approval_deadline_at"
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "approved_at"
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "rejected_at"
    },
    approvalStatus: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED", "EXPIRED"),
      allowNull: false,
      defaultValue: "PENDING",
      field: "approval_status"
    },
    paymentExpectedBy: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "payment_expected_by"
    },
    paymentReceived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "payment_received"
    },
    approvalNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "approval_note"
    },
    rejectionNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "rejection_note"
    },
    proofNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "proof_note"
    },
    reminded48hAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "reminded_48h_at"
    },
    reminded24hAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "reminded_24h_at"
    },
    reminded6hAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "reminded_6h_at"
    }
  },
  {
    sequelize,
    modelName: "LeadWonApproval",
    tableName: "lead_won_approvals",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["sales_user_id"] },
      { fields: ["manager_id"] },
      { fields: ["approval_status"] },
      { fields: ["approval_deadline_at"] }
    ]
  }
);

LeadWonApproval.belongsTo(Lead, { as: "lead", foreignKey: "leadId" });
LeadWonApproval.belongsTo(User, { as: "salesUser", foreignKey: "salesUserId" });
LeadWonApproval.belongsTo(User, { as: "manager", foreignKey: "managerId" });

