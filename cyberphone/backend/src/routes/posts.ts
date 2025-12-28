import { Router } from "express";
import { createPost, listFeed, uploadDirect } from "../controllers/postsController";
import { authMiddleware } from "../middleware/auth";
import { uploadMiddleware } from "../middleware/multer";

const router = Router();

router.get("/feed", authMiddleware, listFeed);
router.post("/", authMiddleware, createPost);

// novo endpoint: upload direto do dispositivo para o servidor
router.post("/upload", authMiddleware, uploadMiddleware.single("file"), uploadDirect);

export default router;