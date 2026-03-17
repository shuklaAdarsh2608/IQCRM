-- Add token_version column for force-logout support
-- Run this migration once. If the column already exists, the command will fail (safe to ignore).

ALTER TABLE users ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0;
