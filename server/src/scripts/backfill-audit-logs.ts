import { runAuditBackfill } from "../lib/audit-backfill.js";

// Usage: npm run backfill:audit (from server/)
// Creates audit log entries for appointments that have none yet.
runAuditBackfill()
  .then(({ appointmentsScanned, entriesInserted }) => {
    console.log(
      `Audit backfill complete: scanned ${appointmentsScanned} appointments, inserted ${entriesInserted} entries.`,
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("Audit backfill failed:", error);
    process.exit(1);
  });
