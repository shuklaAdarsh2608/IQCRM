import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  listInternalConversations,
  getOrCreateInternalConversation,
  getInternalMessages,
  sendInternalMessage
} from "../controllers/internalChatController.js";

const router = express.Router();

router.use(requireAuth);

// Internal team chat (no WhatsApp)
router.get("/conversations", listInternalConversations);
router.post("/conversations", getOrCreateInternalConversation);
router.get("/conversations/:id/messages", getInternalMessages);
router.post("/conversations/:id/messages", sendInternalMessage);

export { router as chatRouter };
