import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { buyProduct, checkoutIntent } from "../controllers/ordersController";

const router = Router();

router.post("/product/:id/buy", authMiddleware, buyProduct); // immediate buy (mock)
router.post("/checkout-intent", authMiddleware, checkoutIntent); // create intent (choose provider)

export default router;