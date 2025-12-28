import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { listNotifications, markAsRead } from "../controllers/notificationsController";

const router = Router();

router.get("/", authMiddleware, listNotifications);
router.post("/:id/read", authMiddleware, markAsRead);

export default router;