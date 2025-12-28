import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { createAd, listAds } from "../controllers/adsController";

const router = Router();

router.post("/", authMiddleware, createAd);
router.get("/", listAds);

export default router;