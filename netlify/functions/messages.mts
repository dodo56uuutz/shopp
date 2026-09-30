import type { Config, Context } from "@netlify/functions";
import { asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { messages } from "../../db/schema.js";

const json = (data: unknown, status = 200) => Response.json(data, { status });

export default async (req: Request, context: Context) => {
  try {
    const visitorId = String(context.params.visitorId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
    if (!visitorId) return json({ error: "Invalid visitor" }, 400);
    if (req.method === "GET") {
      const rows = await db.select().from(messages).where(eq(messages.visitorId, visitorId)).orderBy(asc(messages.createdAt));
      return json(rows);
    }
    if (req.method === "POST") {
      const payload = await req.json();
      const body = String(payload.body || "").trim().slice(0, 1000);
      if (!body) return json({ error: "Message is required" }, 400);
      const [message] = await db.insert(messages).values({ visitorId, sender: "visitor", body }).returning();
      return json(message, 201);
    }
    return json({ error: "Method not allowed" }, 405);
  } catch {
    return json({ error: "Unable to process messages" }, 500);
  }
};

export const config: Config = { path: "/api/messages/:visitorId" };
