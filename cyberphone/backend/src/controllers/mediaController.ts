import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getMedia(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return res.status(404).json({ error: "Media não encontrada" });
    res.json({ media });
  } catch (err: any) {
    console.error("getMedia error", err);
    res.status(500).json({ error: "Erro ao obter media" });
  }
}