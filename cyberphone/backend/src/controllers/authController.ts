import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

export async function register(req: Request, res: Response) {
  const { email, password, username, name } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ error: "email, password, username required" });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: "email exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const affiliateCode = uuidv4().split("-")[0];

  const user = await prisma.user.create({
    data: { email, passwordHash, username, name, affiliateCode },
  });

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
  res.json({ user: { id: user.id, email: user.email, username: user.username }, token });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "missing" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
  res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
}

export async function me(req: Request, res: Response) {
  // authMiddleware attaches userId
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "not found" });
  res.json({ user: { id: user.id, email: user.email, username: user.username, name: user.name } });
}