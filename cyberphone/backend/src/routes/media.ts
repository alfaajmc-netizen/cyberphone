import { Router } from "express";
import { getMedia } from "../controllers/mediaController";

const router = Router();

router.get("/:id", getMedia);

export default router;