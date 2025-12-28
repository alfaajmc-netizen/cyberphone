import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { applyFilter } from "../controllers/aiController";

const router = Router();

router.post("/filter", authMiddleware, applyFilter);

export default router;