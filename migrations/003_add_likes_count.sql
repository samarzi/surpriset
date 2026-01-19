-- Add likes_count column to products table
ALTER TABLE products ADD COLUMN likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0);

-- Create index for likes_count for better performance
CREATE INDEX idx_products_likes_count ON products(likes_count);

-- Update existing products to have correct likes count
UPDATE products SET likes_count = (
    SELECT COUNT(*) 
    FROM product_likes 
    WHERE product_likes.product_id = products.id
);

-- Create function to automatically update likes count
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
CREATE TRIGGER trigger_update_likes_count_insert
    AFTER INSERT ON product_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_product_likes_count();

CREATE TRIGGER trigger_update_likes_count_delete
    AFTER DELETE ON product_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_product_likes_count();