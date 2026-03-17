import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash"
    },
    role: {
      type: DataTypes.ENUM(
        "SUPER_ADMIN",
        "ADMIN",
        "MANAGER",
        "TEAM_LEADER",
        "USER"
      ),
      allowNull: false,
      defaultValue: "USER"
    },
    managerId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "manager_id"
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active"
    },
    tokenVersion: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "token_version"
    }
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true
  }
);

User.belongsTo(User, { as: "manager", foreignKey: "managerId" });
User.hasMany(User, { as: "teamMembers", foreignKey: "managerId" });

