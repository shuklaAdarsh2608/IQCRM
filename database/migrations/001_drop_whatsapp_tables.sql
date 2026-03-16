-- Migration: Remove legacy WhatsApp / external chat tables.
-- Run this once on your existing database after switching to internal chat.
-- Order matters: drop child tables before parent (chat_messages -> chat_conversations).

USE iqlead;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_conversations;
DROP TABLE IF EXISTS whatsapp_messages;

SET FOREIGN_KEY_CHECKS = 1;
