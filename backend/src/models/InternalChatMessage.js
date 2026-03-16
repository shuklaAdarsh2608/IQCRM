import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./User.js";
import { InternalConversation } from "./InternalConversation.js";

export class InternalChatMessage extends Model {}

InternalChatMessage.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    conversationId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "conversation_id"
    },
    senderId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "sender_id"
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_at"
    }
  },
  {
    sequelize,
    modelName: "InternalChatMessage",
    tableName: "internal_chat_messages",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

InternalChatMessage.belongsTo(User, { as: "sender", foreignKey: "senderId" });
InternalChatMessage.belongsTo(InternalConversation, { as: "conversation", foreignKey: "conversationId" });
