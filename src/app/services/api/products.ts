import { Request, Response } from "express";
import { createProduct, returnProducts } from "../../../db/queries.js";

export async function createProductsHandler(req: Request, res: Response) {
  try {
    const { name, price, stock } = req.body;
    const product = await createProduct({ name, price, stock });
    return res.status(201).json({ product });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
}

export async function returnProductsHandler(req: Request, res: Response) {
  try {
    const products = await returnProducts();
    return res.status(200).json({ products });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
}
