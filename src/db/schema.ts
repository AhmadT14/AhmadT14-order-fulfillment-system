import {
  timestamp,
  pgEnum,
  uuid,
  integer,
  pgTable,
  varchar,
  decimal,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  hashed_password: varchar({ length: 255 }).notNull(),
});
export const statusEnum = pgEnum("status", [
  "pending",
  "cancelled",
  "completed",
]);

export const ordersTable = pgTable("orders", {
  id: uuid().primaryKey().defaultRandom(),
  user_id: integer().references(() => usersTable.id),
  status: statusEnum().notNull().default("pending"),
  total_amount: integer().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const orderItemsTable = pgTable("order_items", {
  id: uuid().primaryKey().defaultRandom(),
  order_id: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  product_id: uuid("product_id")
    .notNull()
    .references(() => productsTable.id),
  quantity: integer().notNull(),
  price_at_purchase: decimal("price_at_purchase", {
    precision: 10,
    scale: 2,
  }).notNull(),
});

export const productsTable = pgTable("products", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  price: integer().notNull(),
  stock: decimal("price_at_purchase", {
    precision: 10,
    scale: 2,
  }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
