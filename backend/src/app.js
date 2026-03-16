import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

const clientUrl = process.env.CLIENT_URL || "http://localhost:3001";

app.use(helmet());
app.use(
  cors({
    origin: [clientUrl, "http://localhost:3000", "http://localhost:3001"],
    credentials: false
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300
});
app.use(limiter);

app.use("/api", apiRouter);

app.use(errorHandler);

export { app };

