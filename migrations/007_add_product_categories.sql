-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);

-- Insert some default categories
INSERT INTO product_categories (name, description) VALUES 
    ('Подарочные наборы', 'Готовые подарочные наборы для различных случаев'),
    ('Сладости', 'Конфеты, шоколад и другие сладкие товары'),
    ('Напитки', 'Чай, кофе и другие напитки'),
    ('Аксессуары', 'Дополнительные товары и аксессуары')
ON CONFLICT (name) DO NOTHING;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_categories_updated_at 
    BEFORE UPDATE ON product_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();