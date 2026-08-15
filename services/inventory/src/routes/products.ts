import { Router, type Request, type Response } from "express";
import { createProduct, returnProductById } from "../db/queries.js";
import { redis } from "../redis.js";

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

    const productData = await redis.get(`product:${id}`);
    if (productData) {
      return res.json({ product: JSON.parse(productData) });
    }

    const product = await returnProductById({ productId: id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    try {
      await redis.set(`product:${id}`, JSON.stringify(product), "EX", 3600);
    } catch (cacheError) {
      console.error("Failed to cache product:", cacheError);
    }

    return res.json({ product });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;
