import type { Config, Context } from "@netlify/functions";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { products } from "../../db/schema.js";

const json = (data: unknown, status = 200) => Response.json(data, { status });

export default async (req: Request, context: Context) => {
  try {
    if (req.method === "GET") {
      return json(await db.select().from(products).orderBy(desc(products.createdAt)));
    }

    if (req.method === "POST") {
      const body = await req.json();
      const name = String(body.name || "").trim().slice(0, 120);
      const description = String(body.description || "").trim().slice(0, 600);
      const image = String(body.image || "").trim().slice(0, 1000);
      const price = Number(body.price);
      if (!name || !Number.isFinite(price) || price <= 0) return json({ error: "Invalid product" }, 400);
      const [product] = await db.insert(products).values({ name, description, image, price: price.toFixed(2) }).returning();
      return json(product, 201);
    }

    if (req.method === "DELETE") {
      const id = Number(context.params.id);
      if (!Number.isInteger(id)) return json({ error: "Invalid product id" }, 400);
      await db.delete(products).where(eq(products.id, id));
      return new Response(null, { status: 204 });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch {
    return json({ error: "Unable to process products" }, 500);
  }
};

export const config: Config = { path: ["/api/products", "/api/products/:id"] };
