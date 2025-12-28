// trecho relevante modificado/expandido (integre no arquivo worker existente)
import { Worker } from "bullmq";
import IORedis from "ioredis";
import fs from "fs";
import path from "path";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { spawn } from "child_process";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";

const prisma = new PrismaClient();
const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
});

const redisConnection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

// ...existing runFFmpeg, tmpDir setup, worker creation...

const worker = new Worker(
  "transcode",
  async (job) => {
    const { mediaId, uploaderId } = job.data as { mediaId: string; uploaderId?: string };
    console.log("Processing transcode job for media", mediaId, "uploaderId=", uploaderId);
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new Error("media not found");

    await prisma.media.update({ where: { id: mediaId }, data: { processingStatus: "processing" } });

    // ... download, transcode, thumbnail, upload logic unchanged ...

    // After successful upload and DB update:
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        transcodedUrl,
        thumbnailUrl,
        processingStatus: "done",
      },
    });

    // Publish notification to Redis so backend socket server can forward to the user in realtime
    if (uploaderId) {
      const payload = {
        userId: uploaderId,
        type: "media:processed",
        mediaId,
        thumbnailUrl,
        transcodedUrl,
        timestamp: new Date().toISOString(),
        message: "O teu vídeo foi processado e já está pronto.",
      };
      try {
        await redisConnection.publish("notifications", JSON.stringify(payload));
        console.log("Published notification to redis for user", uploaderId);
      } catch (pubErr) {
        console.warn("Failed to publish notification to redis:", pubErr);
      }
    }

    // cleanup temp files...
  },
  { connection: redisConnection }
);