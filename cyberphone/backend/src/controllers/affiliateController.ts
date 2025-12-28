import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function listAffiliateSales(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const sales = await prisma.affiliateSale.findMany({
      where: { affiliateId: userId },
      include: { order: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ sales });
  } catch (err: any) {
    console.error("listAffiliateSales", err);
    res.status(500).json({ error: "Erro a obter vendas afiliadas" });
  }
}