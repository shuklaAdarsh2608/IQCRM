import { expireWonApprovals, sendApprovalReminders } from "../services/streakApprovalService.js";

export function startWonApprovalCron() {
  const everyMs = Number(process.env.WON_APPROVAL_CRON_MS || 5 * 60 * 1000);
  // eslint-disable-next-line no-console
  console.log(`Won approval cron every ${Math.round(everyMs / 1000)}s`);

  const tick = async () => {
    try {
      await sendApprovalReminders();
      await expireWonApprovals();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Won approval cron failed:", e?.message || e);
    }
  };

  tick();
  return setInterval(tick, everyMs);
}

