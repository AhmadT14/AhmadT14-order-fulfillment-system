import { Router, type Request, type Response } from "express";
import { createProduct, returnProductById } from "../db/queries.js";

const router = Router();

router.post("/products", async (req: Request, res: Response) => {
  try {
    const { name, price, stock } = req.body;
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const product = await createProduct({ name, price, stock });
    return res.status(201).json({ product });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await returnProductById({ productId: id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json({ product });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;
