import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createAd(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { title, imageUrl, link, pricePerDay, startAt, endAt } = req.body;
    if (!title || !pricePerDay) return res.status(400).json({ error: "title and pricePerDay required" });
    const ad = await prisma.ad.create({
      data: {
        creatorId: userId,
        title,
        imageUrl,
        link,
        pricePerDay: Number(pricePerDay),
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
      },
    });
    res.json({ ad });
  } catch (err: any) {
    console.error("createAd", err);
    res.status(500).json({ error: "Erro a criar anúncio" });
  }
}

export async function listAds(req: Request, res: Response) {
  try {
    const ads = await prisma.ad.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ ads });
  } catch (err: any) {
    console.error("listAds", err);
    res.status(500).json({ error: "Erro a listar anúncios" });
  }
}