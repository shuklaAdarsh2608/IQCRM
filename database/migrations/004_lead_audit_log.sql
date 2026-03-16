-- Lead update history for Admin/Super Admin visibility
USE iqlead;

CREATE TABLE IF NOT EXISTS lead_audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  field_name VARCHAR(80) NOT NULL,
  old_value VARCHAR(500) NULL,
  new_value VARCHAR(500) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lead_audit_log_lead_id (lead_id),
  CONSTRAINT fk_lead_audit_log_lead_id FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT fk_lead_audit_log_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE
);
