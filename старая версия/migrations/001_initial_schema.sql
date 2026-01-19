-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    composition TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    original_price DECIMAL(10,2) CHECK (original_price >= 0),
    images TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}' CHECK (array_length(tags, 1) <= 3),
    status VARCHAR(20) DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'coming_soon', 'out_of_stock')),
    type VARCHAR(20) DEFAULT 'product' CHECK (type IN ('product', 'bundle')),
    is_featured BOOLEAN DEFAULT false,
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_address TEXT,
    items JSONB NOT NULL,
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    type VARCHAR(20) DEFAULT 'regular' CHECK (type IN ('regular', 'custom_bundle')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create banners table
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    image TEXT NOT NULL,
    link TEXT,
    is_active BOOLEAN DEFAULT true,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_created_at ON products(created_at);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_type ON orders(type);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE INDEX idx_banners_is_active ON banners(is_active);
CREATE INDEX idx_banners_order ON banners("order");

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO products (sku, name, description, price, images, tags, status, type, is_featured) VALUES
('GIFT-001', 'Романтический набор', 'Идеальный подарок для влюбленных', 2500.00, ARRAY['https://example.com/romantic1.jpg'], ARRAY['романтика', 'любовь'], 'in_stock', 'bundle', true),
('PROD-001', 'Свеча ароматическая', 'Свеча с ароматом ванили', 450.00, ARRAY['https://example.com/candle1.jpg'], ARRAY['свечи', 'аромат'], 'in_stock', 'product', false),
('PROD-002', 'Шоколад премиум', 'Бельгийский шоколад ручной работы', 890.00, ARRAY['https://example.com/chocolate1.jpg'], ARRAY['сладости', 'премиум'], 'in_stock', 'product', true),
('PROD-003', 'Мягкая игрушка', 'Плюшевый мишка 30см', 1200.00, ARRAY['https://example.com/teddy1.jpg'], ARRAY['игрушки', 'детям'], 'coming_soon', 'product', false),
('GIFT-002', 'Набор для чая', 'Элитный чай с аксессуарами', 3200.00, ARRAY['https://example.com/tea1.jpg'], ARRAY['чай', 'элитный'], 'in_stock', 'bundle', true);

INSERT INTO banners (title, image, is_active, "order") VALUES
('Новогодние подарки', 'https://example.com/banner1.jpg', true, 1),
('Скидки до 50%', 'https://example.com/banner2.jpg', true, 2),
('Индивидуальные наборы', 'https://example.com/banner3.jpg', false, 3);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to products and banners
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (true);

CREATE POLICY "Banners are viewable by everyone" ON banners
    FOR SELECT USING (true);

-- Create policies for orders (users can only see their own orders)
CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (true);

-- Admin policies (you'll need to implement authentication)
-- For now, allowing all operations for development
CREATE POLICY "Admin can manage products" ON products
    FOR ALL USING (true);

CREATE POLICY "Admin can manage banners" ON banners
    FOR ALL USING (true);

CREATE POLICY "Admin can manage orders" ON orders
    FOR ALL USING (true);