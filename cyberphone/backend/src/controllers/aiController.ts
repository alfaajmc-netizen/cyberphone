import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { applyFilterMock } from "../adapters/aiProvider";

const prisma = new PrismaClient();

const FILTER_PRICE = 50; // 50 Kz per filter

export async function applyFilter(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { imageUrl, filter } = req.body;
    if (!imageUrl || !filter) return res.status(400).json({ error: "imageUrl and filter required" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if ((user.walletBalance || 0) < FILTER_PRICE) return res.status(402).json({ error: "Saldo insuficiente" });

    // deduct balance
    await prisma.user.update({ where: { id: userId }, data: { walletBalance: { decrement: FILTER_PRICE } } });

    // call AI provider (mock)
    const result = await applyFilterMock({ imageUrl, filter });

    // save media
    const media = await prisma.media.create({
      data: { url: result.url, type: "image/filtered", size: 0 },
    });

    // create order to represent the payment (type ai-filter)
    const order = await prisma.order.create({
      data: {
        buyerId: userId,
        sellerId: userId, // platform keeps for now
        amount: FILTER_PRICE,
        status: "completed",
        type: "ai-filter",
        metadata: { filter, source: imageUrl, mediaId: media.id },
      },
    });

    res.json({ media, order });
  } catch (err: any) {
    console.error("applyFilter error", err);
    res.status(500).json({ error: "Erro ao aplicar filtro" });
  }
}