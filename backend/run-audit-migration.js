/**
 * One-time script to create lead_audit_log table for lead update history.
 * Run from backend folder: node run-audit-migration.js
 */
import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false
  }
);

const sql = `
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
)
`;

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.query(sql);
    console.log("Migration done: lead_audit_log table created.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
