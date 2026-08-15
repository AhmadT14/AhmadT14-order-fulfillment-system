import "dotenv/config";
import express from "express";
import { Redis } from "ioredis";
import { eq, sql } from "drizzle-orm";
import { db } from "./db/index.js";
import { productsTable } from "./db/schema.js";
import productsRouter from "./routes/products.js";
import { redis } from "./redis.js";

const app = express();
app.use(express.json());
app.use(productsRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Inventory service HTTP API running on port ${port}`);
});

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("Missing REDIS_URL environment variable");
}

const subscriber = new Redis(redisUrl);

subscriber.subscribe("order.created", (err) => {
  if (err) {
    console.error("Failed to subscribe to order.created:", err);
    return;
  }
  console.log("Inventory service listening for order.created events");
});

subscriber.on("message", async (channel, message) => {
  if (channel !== "order.created") return;
  try {
    const order = JSON.parse(message);
    for (const item of order.items) {
      await db
        .update(productsTable)
        .set({ stock: sql`${productsTable.stock} - ${item.quantity}` })
        .where(eq(productsTable.id, item.productId));
      await redis.del(`product:${item.productId}`);
    }
    console.log(`Stock updated for order ${order.id}`);
  } catch (error) {
    console.error("Failed to process order.created event:", error);
  }
});
