import { db } from "./index.js";
import {
  productsTable,
  orderItemsTable,
  ordersTable,
  usersTable,
} from "./schema.js";
import { eq } from "drizzle-orm";

export async function registerusers({
  email,
  hashedPassword,
  name,
  age,
}: {
  email: string;
  hashedPassword: string;
  name: string;
  age: number;
}) {
  const result = await db
    .insert(usersTable)
    .values({
      name: name,
      age: age,
      email: email,
      hashed_password: hashedPassword,
    })
    .returning();
  return result[0];
}

export async function returnUserByEmail({ email }: { email: string }) {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  return user[0];
}

export async function createOrder({
  userId,
  totalAmount,
}: {
  userId: number;
  totalAmount: number;
}) {
  const result = await db
    .insert(ordersTable)
    .values({
      user_id: userId,
      total_amount: totalAmount,
    })
    .returning();
  return result[0];
}

export async function createOrderItem({
  orderId,
  productId,
  quantity,
  priceAtPurchase,
}: {
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: string;
}) {
  const result = await db
    .insert(orderItemsTable)
    .values({
      order_id: orderId,
      product_id: productId,
      quantity: quantity,
      price_at_purchase: priceAtPurchase,
    })
    .returning();
  return result[0];
}

export async function updateOrderState({
  orderId,
  status,
}: {
  orderId: string;
  status: "pending" | "cancelled" | "completed";
}) {
  const result = await db
    .update(ordersTable)
    .set({
      status: status,
    })
    .where(eq(ordersTable.id, orderId))
    .returning();
  return result[0];
}

export async function returnOrdersByUserId({ userId }: { userId: number }) {
  const result = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.user_id, userId));
  return result;
}

export async function returnOrderById({ orderId }: { orderId: string }) {
  const result = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId));
  return result[0];
}

export async function returnProductById({ productId }: { productId: string }) {
  const result = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));
  return result[0];
}
