import type { Config } from "@netlify/functions";
import { desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { orders } from "../../db/schema.js";

const json = (data: unknown, status = 200) => Response.json(data, { status });

export default async (req: Request) => {
  try {
    if (req.method === "GET") return json(await db.select().from(orders).orderBy(desc(orders.createdAt)));
    if (req.method === "POST") {
      const body = await req.json();
      const customer = String(body.customer || "").trim().slice(0, 120);
      const phone = String(body.phone || "").trim().slice(0, 40);
      const items = Array.isArray(body.items) ? body.items : [];
      if (!customer || !phone || items.length === 0) return json({ error: "Invalid order" }, 400);
      const safeItems: Array<{ id: number; name: string; price: number; qty: number }> = items.slice(0, 50).map((item: any) => ({
        id: Number(item.id), name: String(item.name || "").slice(0, 120),
        price: Number(item.price), qty: Math.max(1, Math.min(99, Number(item.qty) || 1)),
      }));
      const total = safeItems.reduce((sum, item) => sum + item.price * item.qty, 0);
      if (!Number.isFinite(total) || total <= 0) return json({ error: "Invalid order total" }, 400);
      const [order] = await db.insert(orders).values({ customer, phone, items: JSON.stringify(safeItems), total: total.toFixed(2) }).returning();
      return json(order, 201);
    }
    return json({ error: "Method not allowed" }, 405);
  } catch {
    return json({ error: "Unable to process orders" }, 500);
  }
};

export const config: Config = { path: "/api/orders" };
