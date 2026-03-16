import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./User.js";

export class InternalConversation extends Model {}

InternalConversation.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    user1Id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "user1_id"
    },
    user2Id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "user2_id"
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_message_at"
    }
  },
  {
    sequelize,
    modelName: "InternalConversation",
    tableName: "internal_conversations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

InternalConversation.belongsTo(User, { as: "user1", foreignKey: "user1Id" });
InternalConversation.belongsTo(User, { as: "user2", foreignKey: "user2Id" });
