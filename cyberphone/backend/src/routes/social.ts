import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { likePost, unlikePost, commentPost, listComments, followUser, unfollowUser } from "../controllers/socialController";

const router = Router();

router.post("/posts/:id/like", authMiddleware, likePost);
router.post("/posts/:id/unlike", authMiddleware, unlikePost);
router.post("/posts/:id/comments", authMiddleware, commentPost);
router.get("/posts/:id/comments", listComments);

router.post("/users/:id/follow", authMiddleware, followUser);
router.post("/users/:id/unfollow", authMiddleware, unfollowUser);

export default router;