import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * listLives - retorna lives futuras / recentes
 */
export async function listLives(req: Request, res: Response) {
  try {
    const lives = await prisma.live.findMany({
      orderBy: { createdAt: "desc" },
      include: { host: { select: { id: true, username: true, name: true, avatarUrl: true } } },
      take: 100,
    });
    res.json({ lives });
  } catch (err: any) {
    console.error("listLives error", err);
    res.status(500).json({ error: "Erro a listar lives" });
  }
}

/**
 * getLive - obtém detalhes da live
 */
export async function getLive(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const live = await prisma.live.findUnique({
      where: { id },
      include: { host: { select: { id: true, username: true, name: true, avatarUrl: true } } },
    });
    if (!live) return res.status(404).json({ error: "Live não encontrada" });
    res.json({ live });
  } catch (err: any) {
    console.error("getLive error", err);
    res.status(500).json({ error: "Erro ao obter live" });
  }
}

/**
 * createLive - body: title, description, price (int Kz)
 * authenticated user becomes host
 */
export async function createLive(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { title, description, price } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });
    const live = await prisma.live.create({
      data: {
        hostId: userId,
        title,
        description,
        price: Number(price || 0),
      },
    });
    res.json({ live });
  } catch (err: any) {
    console.error("createLive error", err);
    res.status(500).json({ error: "Erro a criar live" });
  }
}

/**
 * buyTicket - cria Order para a live (mock payment)
 */
export async function buyTicket(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const liveId = req.params.id;
    const live = await prisma.live.findUnique({ where: { id: liveId } });
    if (!live) return res.status(404).json({ error: "Live não encontrada" });

    // For MVP assume immediate payment success (in production integrate gateways)
    const amount = live.price || 0;

    // create order linking buyer (userId) and seller (host)
    const order = await prisma.order.create({
      data: {
        productId: null,
        buyerId: userId,
        sellerId: live.hostId,
        amount,
        status: "completed",
      },
    });

    // Optionally increment viewers count
    await prisma.live.update({ where: { id: liveId }, data: { viewers: { increment: 1 } } });

    res.json({ ok: true, order });
  } catch (err: any) {
    console.error("buyTicket error", err);
    res.status(500).json({ error: "Erro ao comprar ingresso" });
  }
}