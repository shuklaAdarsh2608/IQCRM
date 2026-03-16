-- Fix internal_conversations.updated_at: ensure it has a default so INSERTs without an explicit value work.
USE iqlead;

ALTER TABLE internal_conversations
  MODIFY updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
