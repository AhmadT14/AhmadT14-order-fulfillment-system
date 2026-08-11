import { Request, Response } from "express";
import {
  returnOrderById,
  returnOrdersByUserId,
  createOrder,
  createOrderItem,
  returnOrderItems,
} from "../db/queries.js";
import { redis } from "../redis.js";

export async function createOrdersHandler(req: Request, res: Response) {
  try {
    const currentUserId = (req as any).user?.sub as string | undefined;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid order items" });
    }

    const resolvedItems: {
      productId: string;
      quantity: number;
      priceAtPurchase: string;
    }[] = [];
    let totalAmount = 0;

    for (const item of items) {
      const response = await fetch(
        `http://inventory:3001/products/${item.productId}`,
      );

      if (!response.ok) {
        return res
          .status(400)
          .json({ message: `Product not found: ${item.productId}` });
      }

      const { product } = await response.json();

      if (!product) {
        return res.status(400).json({
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product: ${product.name}`,
        });
      }

      totalAmount += product.price * item.quantity;

      resolvedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price.toFixed(2),
      });
    }

    const order = await createOrder({
      userId: Number(currentUserId),
      totalAmount,
    });

    for (const item of resolvedItems) {
      await createOrderItem({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      });
    }
    await redis.publish(
      "order.created",
      JSON.stringify({
        id: order.id,
        items: resolvedItems,
      }),
    );
    return res.status(201).json({ order, items: resolvedItems });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
}

export async function getOrderByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await returnOrderById({ orderId: id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const currentUserId = (req as any).user?.sub as string | undefined;

    if (
      !currentUserId ||
      order.user_id === null ||
      order.user_id !== Number(currentUserId)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const orderItems = await returnOrderItems({ orderId: id });

    return res.json({ order, items: orderItems });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
}

export async function returnOrdersByUserIdHandler(req: Request, res: Response) {
  try {
    const currentUserId = (req as any).user?.sub as string | undefined;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orders = await returnOrdersByUserId({
      userId: Number(currentUserId),
    });

    let ordersWithItems = [];
    for (const order of orders) {
      const orderItems = await returnOrderItems({ orderId: order.id });
      ordersWithItems.push({ ...order, items: orderItems });
    }

    return res.json({ orders: ordersWithItems });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
}
