// trecho atualizado: adicionar import da fila
import { addTranscodeJob } from "../queues/transcodeQueue";
...
export async function uploadDirect(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: "Nenhum ficheiro enviado" });

    const key = `${uuidv4()}_${file.originalname}`;
    const bucket = process.env.S3_BUCKET;
    const filePath = file.path;
    const fileStream = fs.createReadStream(filePath);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype,
        ContentLength: file.size,
      })
    );

    let url = "";
    if (process.env.S3_PUBLIC_URL) {
      url = `${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
    } else if (process.env.S3_ENDPOINT) {
      const endpoint = process.env.S3_ENDPOINT.replace(/^https?:\/\//, "").replace(/\/$/, "");
      url = `https://${endpoint}/${bucket}/${key}`;
    } else {
      url = `s3://${bucket}/${key}`;
    }

    const media = await prisma.media.create({
      data: {
        url,
        type: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
        processingStatus: file.mimetype.startsWith("video/") ? "pending" : "done",
      },
    });

    // if video -> enqueue transcode
    if (file.mimetype.startsWith("video/")) {
      await addTranscodeJob({ mediaId: media.id });
    }

    fs.unlink(filePath, (err) => {
      if (err) console.warn("Failed to remove temp file:", filePath, err);
    });

    res.json({ media });
  } catch (err: any) {
    console.error("uploadDirect error", err);
    res.status(500).json({ error: "Erro no upload", detail: err?.message || String(err) });
  }
}