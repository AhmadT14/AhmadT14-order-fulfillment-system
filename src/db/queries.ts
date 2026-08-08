import { db } from "./index.js";
import { usersTable } from "./schema.js";
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
      hashedPassword: hashedPassword,
    })
    .returning();
}

export async function returnHashedPassword({ email }: { email: string }) {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  return user[0]?.hashedPassword;
}

export async function returnUserId({ email }: { email: string }) {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  return user[0]?.id;
}
