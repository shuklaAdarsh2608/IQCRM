import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import {
  InternalConversation,
  InternalChatMessage,
  User
} from "../models/index.js";

const userAttrs = ["id", "name", "email", "role"];

/** List conversations for the current user; each includes the other participant and last message preview */
export async function listInternalConversations(req, res, next) {
  try {
    const userId = req.user.id;
    const list = await InternalConversation.findAll({
      where: {
        [Op.or]: [{ user1Id: userId }, { user2Id: userId }]
      },
      order: [
        [sequelize.literal("last_message_at IS NULL"), "ASC"],
        ["lastMessageAt", "DESC"],
        [sequelize.literal("InternalConversation.created_at"), "DESC"]
      ],
      include: [
        { association: "user1", attributes: userAttrs },
        { association: "user2", attributes: userAttrs }
      ]
    });

    const rows = await Promise.all(
      list.map(async (c) => {
        const otherUser = c.user1Id === userId ? c.user2 : c.user1;
        const lastMsg = await InternalChatMessage.findOne({
          where: { conversationId: c.id },
          order: [[sequelize.literal("InternalChatMessage.created_at"), "DESC"]],
          attributes: ["id", "body", "senderId", "createdAt"],
          include: [{ association: "sender", attributes: ["id", "name"] }]
        });
        const isFromMe = lastMsg && lastMsg.senderId === userId;
        const senderLabel = lastMsg ? (isFromMe ? "You" : (lastMsg.sender?.name || "Unknown")) : null;
        return {
          id: c.id,
          otherUser: otherUser
            ? { id: otherUser.id, name: otherUser.name, email: otherUser.email, role: otherUser.role }
            : null,
          lastMessageAt: c.lastMessageAt,
          lastMessagePreview: lastMsg
            ? {
                body: lastMsg.body?.slice(0, 80) || "",
                senderId: lastMsg.senderId,
                senderName: senderLabel,
                isFromMe,
                createdAt: lastMsg.createdAt
              }
            : null,
          createdAt: c.createdAt
        };
      })
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/** Get or create a conversation with another user. Body: { otherUserId } */
export async function getOrCreateInternalConversation(req, res, next) {
  try {
    const { otherUserId } = req.body;
    const me = req.user.id;
    const otherId = Number(otherUserId);
    if (!otherId || otherId === me) {
      return res.status(400).json({ success: false, message: "Invalid or same user." });
    }

    const other = await User.findOne({
      where: { id: otherId, isActive: true },
      attributes: userAttrs
    });
    if (!other) {
      return res.status(404).json({ success: false, message: "User not found or inactive." });
    }

    const [u1, u2] = me < otherId ? [me, otherId] : [otherId, me];
    let conv = await InternalConversation.findOne({
      where: { user1Id: u1, user2Id: u2 },
      include: [
        { association: "user1", attributes: userAttrs },
        { association: "user2", attributes: userAttrs }
      ]
    });
    if (!conv) {
      conv = await InternalConversation.create({
        user1Id: u1,
        user2Id: u2
      });
      conv = await InternalConversation.findByPk(conv.id, {
        include: [
          { association: "user1", attributes: userAttrs },
          { association: "user2", attributes: userAttrs }
        ]
      });
    }

    let otherUser = conv.user1Id === me ? conv.user2 : conv.user1;
    if (!otherUser && other) otherUser = other;
    res.json({
      success: true,
      data: {
        id: conv.id,
        otherUser: otherUser
          ? { id: otherUser.id, name: otherUser.name, email: otherUser.email, role: otherUser.role }
          : null,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

/** Get messages for an internal conversation; user must be a participant */
export async function getInternalMessages(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const conv = await InternalConversation.findOne({
      where: { id },
      include: [
        { association: "user1", attributes: userAttrs },
        { association: "user2", attributes: userAttrs }
      ]
    });
    if (!conv) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    if (conv.user1Id !== userId && conv.user2Id !== userId) {
      return res.status(403).json({ success: false, message: "Not a participant." });
    }

    const messages = await InternalChatMessage.findAll({
      where: { conversationId: id },
      order: [[sequelize.literal("InternalChatMessage.created_at"), "ASC"]],
      include: [{ association: "sender", attributes: userAttrs }]
    });

    const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
    res.json({
      success: true,
      data: {
        conversation: {
          id: conv.id,
          otherUser: otherUser
            ? { id: otherUser.id, name: otherUser.name, email: otherUser.email, role: otherUser.role }
            : null
        },
        messages: messages.map((m) => ({
          id: m.id,
          body: m.body,
          senderId: m.senderId,
          sender: m.sender ? { id: m.sender.id, name: m.sender.name, email: m.sender.email } : null,
          createdAt: m.createdAt
        }))
      }
    });
  } catch (err) {
    next(err);
  }
}

/** Send a message in an internal conversation */
export async function sendInternalMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const userId = req.user.id;
    const conv = await InternalConversation.findByPk(id);
    if (!conv) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    if (conv.user1Id !== userId && conv.user2Id !== userId) {
      return res.status(403).json({ success: false, message: "Not a participant." });
    }
    const text = String(body || "").trim();
    if (!text) {
      return res.status(400).json({ success: false, message: "Message body is required." });
    }

    const msg = await InternalChatMessage.create({
      conversationId: conv.id,
      senderId: userId,
      body: text
    });
    await conv.update({ lastMessageAt: new Date() });

    const withSender = await InternalChatMessage.findByPk(msg.id, {
      include: [{ association: "sender", attributes: userAttrs }]
    });
    res.status(201).json({
      success: true,
      data: {
        id: withSender.id,
        body: withSender.body,
        senderId: withSender.senderId,
        sender: withSender.sender
          ? { id: withSender.sender.id, name: withSender.sender.name, email: withSender.sender.email }
          : null,
        createdAt: withSender.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}
