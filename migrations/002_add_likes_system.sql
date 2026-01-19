-- Add likes system to the database

-- Create product_likes table to track user likes
CREATE TABLE product_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_session VARCHAR(255) NOT NULL, -- For anonymous users, we'll use session ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_session)
);

-- Add likes_count column to products table for caching
ALTER TABLE products ADD COLUMN likes_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX idx_product_likes_product_id ON product_likes(product_id);
CREATE INDEX idx_product_likes_user_session ON product_likes(user_session);
CREATE INDEX idx_product_likes_created_at ON product_likes(created_at);
CREATE INDEX idx_products_likes_count ON products(likes_count);

-- Create function to update likes count
CREATE OR REPLACE FUNCTION update_product_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE products 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.product_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE products 
        SET likes_count = likes_count - 1 
        WHERE id = OLD.product_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update likes count
CREATE TRIGGER update_product_likes_count_trigger
    AFTER INSERT OR DELETE ON product_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_product_likes_count();

-- Initialize likes_count for existing products
UPDATE products SET likes_count = (
    SELECT COUNT(*) 
    FROM product_likes 
    WHERE product_likes.product_id = products.id
);

-- Enable RLS for product_likes
ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for product_likes
CREATE POLICY "Anyone can view likes" ON product_likes
    FOR SELECT USING (true);

CREATE POLICY "Anyone can add likes" ON product_likes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can remove their own likes" ON product_likes
    FOR DELETE USING (true);

-- Admin policy for managing likes
CREATE POLICY "Admin can manage all likes" ON product_likes
    FOR ALL USING (true);