import { auditLogBatch } from "../utils/auditFirehose.js";

export async function audit(event: any): Promise<void> {
  const now = new Date();
  event.timestamp = event.timestamp ?? now.toISOString();
  event.date = event.date ?? now.toISOString().slice(0, 10);

  return auditLogBatch([event]);
}
