import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

export const transcodeQueue = new Queue("transcode", { connection });

export async function addTranscodeJob(payload: { mediaId: string; uploaderId?: string }) {
  // payload should include uploaderId to notify the owner when processing finishes
  await transcodeQueue.add("transcode:video", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  });
}