/**
 * One-time script to add the rating column to leads table.
 * Run from backend folder: node run-rating-migration.js
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

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.query(`
      ALTER TABLE leads
      ADD COLUMN rating TINYINT UNSIGNED NULL COMMENT '1-5 star rating' AFTER expected_close_date
    `);
    console.log("Migration done: leads.rating column added.");
  } catch (err) {
    if (err.message && err.message.includes("Duplicate column name")) {
      console.log("Column leads.rating already exists. Skipping.");
    } else {
      console.error("Migration failed:", err.message);
      process.exit(1);
    }
  } finally {
    await sequelize.close();
  }
}

run();
