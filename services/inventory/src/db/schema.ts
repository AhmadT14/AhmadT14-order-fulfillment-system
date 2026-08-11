import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  timestamp,
} from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  price: integer().notNull(),
  stock: integer().notNull(),
  created_at: timestamp().defaultNow().notNull(),
});
