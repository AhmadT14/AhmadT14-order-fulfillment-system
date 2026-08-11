import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { productsTable } from "./schema.js";

export async function createProduct({
  name,
  price,
  stock,
}: {
  name: string;
  price: number;
  stock: string;
}) {
  const result = await db
    .insert(productsTable)
    .values({
      name: name,
      price: price,
      stock: stock,
    })
    .returning();
  return result[0];
}

export async function returnProductById({ productId }: { productId: string }) {
  const result = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));
  return result[0];
}
