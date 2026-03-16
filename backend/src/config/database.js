import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  logging: false,
  define: {
    underscored: true
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export async function testConnection() {
  try {
    await sequelize.authenticate();
    // eslint-disable-next-line no-console
    console.log("Database connection established");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unable to connect to the database:", err.message);
    process.exit(1);
  }
}

