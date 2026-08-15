import { Redis } from "ioredis";

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
  console.log("Notification service listening for order.created events");
});

subscriber.on("message", async (channel, message) => {
  if (channel !== "order.created") return;

  try {
    const order = JSON.parse(message);
    console.log(`Email sent to user ${order.userId} for order ${order.id}`);
  } catch (error) {
    console.error("Failed to process order.created event:", error);
  }
});
