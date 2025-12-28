import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function likePost(req: Request, res: Response) {
  const userId = (req as any).userId;
  const postId = req.params.id;
  try {
    await prisma.like.create({ data: { userId, postId } });
    await prisma.post.update({ where: { id: postId }, data: { likes: { increment: 1 } } });
    // create notification to author
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post && post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: "like",
          payload: { postId, from: userId },
        },
      });
    }
    res.json({ ok: true });
  } catch (err: any) {
    console.error("likePost error", err);
    res.status(400).json({ error: "não foi possível registar like" });
  }
}

export async function unlikePost(req: Request, res: Response) {
  const userId = (req as any).userId;
  const postId = req.params.id;
  try {
    await prisma.like.deleteMany({ where: { userId, postId } });
    await prisma.post.update({ where: { id: postId }, data: { likes: { decrement: 1 } } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error("unlikePost error", err);
    res.status(400).json({ error: "não foi possível remover like" });
  }
}

export async function commentPost(req: Request, res: Response) {
  const userId = (req as any).userId;
  const postId = req.params.id;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Conteúdo obrigatório" });
  try {
    const comment = await prisma.comment.create({
      data: { postId, authorId: userId, content },
    });
    // notify author
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post && post.authorId !== userId) {
      await prisma.notification.create({
        data: { userId: post.authorId, type: "comment", payload: { postId, commentId: comment.id, from: userId } },
      });
    }
    res.json({ comment });
  } catch (err: any) {
    console.error("commentPost error", err);
    res.status(500).json({ error: "Erro a comentar" });
  }
}

export async function listComments(req: Request, res: Response) {
  const postId = req.params.id;
  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
      include: { author: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json({ comments });
  } catch (err: any) {
    console.error("listComments error", err);
    res.status(500).json({ error: "Erro a listar comentários" });
  }
}

export async function followUser(req: Request, res: Response) {
  const userId = (req as any).userId;
  const targetId = req.params.id;
  if (userId === targetId) return res.status(400).json({ error: "Não podes seguir-te a ti mesmo" });
  try {
    await prisma.follow.create({ data: { followerId: userId, followingId: targetId } });
    // notify
    await prisma.notification.create({ data: { userId: targetId, type: "follow", payload: { from: userId } } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error("followUser error", err);
    res.status(400).json({ error: "Não foi possível seguir utilizador" });
  }
}

export async function unfollowUser(req: Request, res: Response) {
  const userId = (req as any).userId;
  const targetId = req.params.id;
  try {
    await prisma.follow.deleteMany({ where: { followerId: userId, followingId: targetId } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error("unfollowUser error", err);
    res.status(400).json({ error: "Não foi possível deixar de seguir" });
  }
}