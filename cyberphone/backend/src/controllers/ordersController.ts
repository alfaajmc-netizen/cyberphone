import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createUnitelPaymentIntent, createEKwanzaPaymentIntent, createCryptomusPaymentIntent } from "../adapters/payments";

const prisma = new PrismaClient();

export async function buyProduct(req: Request, res: Response) {
  try {
    const buyerId = (req as any).userId;
    const productId = req.params.id;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Produto não encontrado" });

    // For MVP: immediate purchase (status completed)
    const order = await prisma.order.create({
      data: {
        productId,
        buyerId,
        sellerId: product.sellerId,
        amount: product.price,
        status: "completed",
        type: "product",
      },
    });

    // If buyer used an affiliate code stored in query/metadata, we could create AffiliateSale.
    res.json({ ok: true, order });
  } catch (err: any) {
    console.error("buyProduct error", err);
    res.status(500).json({ error: "Erro ao comprar produto" });
  }
}

export async function checkoutIntent(req: Request, res: Response) {
  /**
   * Body: { amount, provider, metadata }
   * provider: 'unitel' | 'ekwanza' | 'cryptomus'
   */
  try {
    const { amount, provider, metadata } = req.body;
    if (!amount || !provider) return res.status(400).json({ error: "amount and provider required" });

    let intent: any;
    if (provider === "unitel") intent = await createUnitelPaymentIntent({ amount, metadata });
    else if (provider === "ekwanza") intent = await createEKwanzaPaymentIntent({ amount, metadata });
    else if (provider === "cryptomus") intent = await createCryptomusPaymentIntent({ amount, metadata });
    else return res.status(400).json({ error: "provider not supported" });

    res.json({ intent });
  } catch (err: any) {
    console.error("checkoutIntent error", err);
    res.status(500).json({ error: "Erro a criar intent" });
  }
}