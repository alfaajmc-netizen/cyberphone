import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { createLive, listLives, getLive, buyTicket } from "../controllers/livesController";

const router = Router();

// public list
router.get("/", listLives);
// public get
router.get("/:id", getLive);

// create live (host only - requires auth)
router.post("/", authMiddleware, createLive);

// buy ticket (requires auth)
router.post("/:id/buy", authMiddleware, buyTicket);

export default router;