import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { createProduct, listProducts, getProduct, deleteProduct } from "../controllers/productsController";

const router = Router();

router.get("/", listProducts);
router.post("/", authMiddleware, createProduct);
router.get("/:id", getProduct);
router.delete("/:id", authMiddleware, deleteProduct);

export default router;