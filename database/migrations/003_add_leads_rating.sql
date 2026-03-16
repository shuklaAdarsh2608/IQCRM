-- Add star rating (1-5) to leads for Admin/Super Admin/Manager/Team Leader visibility
USE iqlead;

ALTER TABLE leads
  ADD COLUMN rating TINYINT UNSIGNED NULL COMMENT '1-5 star rating' AFTER expected_close_date;
