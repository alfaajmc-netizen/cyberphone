import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function listNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const nots = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ notifications: nots });
  } catch (err: any) {
    console.error("listNotifications error", err);
    res.status(500).json({ error: "Erro a listar notificações" });
  }
}

export async function markAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const id = req.params.id;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) return res.status(404).json({ error: "Notificação não encontrada" });
    await prisma.notification.update({ where: { id }, data: { read: true } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error("markAsRead error", err);
    res.status(500).json({ error: "Erro ao marcar como lida" });
  }
}