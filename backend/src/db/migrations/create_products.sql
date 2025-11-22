-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price REAL,
    rating REAL,
    review_count INTEGER DEFAULT 0,
    brand TEXT,
    ingredients TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for faster queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Create index on name for search
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Create index on rating for sorting
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);
