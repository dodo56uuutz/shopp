import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial().primaryKey(),
  name: text().notNull(),
  description: text().notNull().default(""),
  image: text().notNull().default(""),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial().primaryKey(),
  customer: text().notNull(),
  phone: text().notNull(),
  items: text().notNull(),
  total: numeric({ precision: 10, scale: 2 }).notNull(),
  status: text().notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial().primaryKey(),
  visitorId: text("visitor_id").notNull(),
  sender: text().notNull(),
  body: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
