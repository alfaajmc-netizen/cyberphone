import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "no token" });
  const parts = header.split(" ");
  if (parts.length !== 2) return res.status(401).json({ error: "bad token" });
  const token = parts[1];
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    (req as any).userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid token" });
  }
}