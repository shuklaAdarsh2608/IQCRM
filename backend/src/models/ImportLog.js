import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./User.js";

export class ImportLog extends Model {}

ImportLog.init(
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
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    totalRows: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "total_rows"
    },
    successRows: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "success_rows"
    },
    failedRows: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "failed_rows"
    },
    status: {
      type: DataTypes.ENUM("PENDING", "COMPLETED", "FAILED"),
      allowNull: false,
      defaultValue: "PENDING"
    }
  },
  {
    sequelize,
    modelName: "ImportLog",
    tableName: "import_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

ImportLog.belongsTo(User, { as: "user", foreignKey: "userId" });

