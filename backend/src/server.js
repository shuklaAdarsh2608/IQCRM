import dotenv from "dotenv";
import { app } from "./app.js";
import { initModels } from "./models/index.js";
import { startWonApprovalCron } from "./cron/wonApprovalCron.js";

dotenv.config();

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  await initModels();
  startWonApprovalCron();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`IQLead API listening on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});

