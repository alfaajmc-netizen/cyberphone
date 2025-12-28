import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { listAffiliateSales } from "../controllers/affiliateController";

const router = Router();

router.get("/sales", authMiddleware, listAffiliateSales);

export default router;