import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function listProducts(req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { seller: { select: { id: true, username: true } }, images: true },
    });
    res.json({ products });
  } catch (err: any) {
    console.error("listProducts", err);
    res.status(500).json({ error: "Erro a listar produtos" });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { title, description, price, imageMediaIds } = req.body;
    if (!title || !price) return res.status(400).json({ error: "title and price required" });
    const product = await prisma.product.create({
      data: { title, description, price: Number(price), sellerId: userId },
    });
    if (Array.isArray(imageMediaIds) && imageMediaIds.length > 0) {
      await prisma.media.updateMany({ where: { id: { in: imageMediaIds } }, data: { postId: null } }); // leave postId null, just keep media
      // associate by setting productId is not in schema; save images as Media with no explicit relation
    }
    res.json({ product });
  } catch (err: any) {
    console.error("createProduct", err);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { seller: { select: { id: true, username: true } }, images: true },
    });
    if (!product) return res.status(404).json({ error: "Produto não encontrado" });
    res.json({ product });
  } catch (err: any) {
    console.error("getProduct", err);
    res.status(500).json({ error: "Erro ao obter produto" });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const id = req.params.id;
    const p = await prisma.product.findUnique({ where: { id } });
    if (!p) return res.status(404).json({ error: "Produto não encontrado" });
    if (p.sellerId !== userId) return res.status(403).json({ error: "Sem permissão" });
    await prisma.product.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error("deleteProduct", err);
    res.status(500).json({ error: "Erro ao remover produto" });
  }
}