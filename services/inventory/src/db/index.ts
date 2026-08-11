import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL environment variable");
}

export const db = drizzle(connectionString, { schema } as any);
