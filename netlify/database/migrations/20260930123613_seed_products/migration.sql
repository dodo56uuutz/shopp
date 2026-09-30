INSERT INTO "products" ("name", "description", "image", "price")
SELECT seed.name, seed.description, seed.image, seed.price
FROM (VALUES
  ('Wireless Headphones', 'Comfortable over-ear headphones with clear sound and long battery life.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80', 349.00),
  ('Smart Watch', 'A lightweight everyday watch for notifications, activity, and health tracking.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80', 499.00),
  ('Classic Backpack', 'A durable and practical backpack for work, study, and short trips.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80', 279.00),
  ('Everyday Sneakers', 'Clean, versatile sneakers designed for all-day comfort.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', 429.00)
) AS seed(name, description, image, price)
WHERE NOT EXISTS (SELECT 1 FROM "products");
