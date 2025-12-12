import { FirehoseClient, PutRecordBatchCommand } from "@aws-sdk/client-firehose";

const client = new FirehoseClient({
  region: "ap-south-1"
});

const STREAM_NAME = "hackoverflow-audit-log-stream";

export async function auditLogBatch(records: any[]): Promise<void> {
  if (!Array.isArray(records) || records.length === 0) return;

  const firehoseRecords = records.map((log) => ({
    Data: Buffer.from(JSON.stringify(log) + "\n"),
  }));

  const command = new PutRecordBatchCommand({
    DeliveryStreamName: STREAM_NAME,
    Records: firehoseRecords
  });

  try {
    const response = await client.send(command);

    if (response.FailedPutCount && response.FailedPutCount > 0) {
      console.error("[AUDIT] Some logs failed:", response.FailedPutCount);
    }

  } catch (err) {
    console.error("[AUDIT] Firehose error:", err);
  }
}
