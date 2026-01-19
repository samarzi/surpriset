-- Migration: Add reviews system
-- Description: Creates reviews table with moderation, admin replies, and photo support

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References auth.users (Supabase Auth)
    user_name VARCHAR(255), -- Имя пользователя из Telegram
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    photos TEXT[], -- массив URL фотографий (максимум 3)
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_reply TEXT, -- ответ админа на отзыв
    admin_reply_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    moderated_by UUID, -- References auth.users
    moderated_at TIMESTAMP,
    can_edit_until TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    CONSTRAINT unique_user_product_review UNIQUE(product_id, user_id) -- один отзыв от пользователя на товар
);

-- Create indexes for better performance
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Add reviews statistics columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_products_reviews_count ON products(reviews_count);
CREATE INDEX IF NOT EXISTS idx_products_average_rating ON products(average_rating);

-- Function to update product reviews statistics
CREATE OR REPLACE FUNCTION update_product_reviews_stats()
RETURNS TRIGGER AS $$
DECLARE
    approved_count INTEGER;
    avg_rating DECIMAL(3,2);
BEGIN
    -- Calculate statistics only for approved reviews
    SELECT 
        COUNT(*),
        COALESCE(AVG(rating), 0)
    INTO 
        approved_count,
        avg_rating
    FROM reviews
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND status = 'approved';
    
    -- Update product statistics
    UPDATE products
    SET 
        reviews_count = approved_count,
        average_rating = ROUND(avg_rating, 2)
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update product reviews statistics
CREATE TRIGGER trigger_update_reviews_stats_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_reviews_stats();

CREATE TRIGGER trigger_update_reviews_stats_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.rating IS DISTINCT FROM NEW.rating)
    EXECUTE FUNCTION update_product_reviews_stats();

CREATE TRIGGER trigger_update_reviews_stats_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_reviews_stats();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on review changes
CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- Initialize reviews_count and average_rating for existing products
UPDATE products SET 
    reviews_count = 0,
    average_rating = 0
WHERE reviews_count IS NULL OR average_rating IS NULL;

-- Add comment
COMMENT ON TABLE reviews IS 'Product reviews with moderation system';
COMMENT ON COLUMN reviews.user_id IS 'References auth.users from Supabase Auth';
COMMENT ON COLUMN reviews.user_name IS 'User name from Telegram WebApp';
COMMENT ON COLUMN reviews.can_edit_until IS 'Users can edit their review within 24 hours of creation';
COMMENT ON COLUMN reviews.admin_reply IS 'Admin response to the review';
COMMENT ON COLUMN reviews.photos IS 'Array of photo URLs (max 3 photos)';

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews" ON reviews
    FOR SELECT USING (status = 'approved');

-- Users can view their own reviews (any status)
CREATE POLICY "Users can view their own reviews" ON reviews
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own reviews
CREATE POLICY "Users can insert reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews within 24 hours
CREATE POLICY "Users can update their own reviews within 24h" ON reviews
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND can_edit_until > NOW()
        AND status = 'pending'
    );

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can do everything (you'll need to implement admin check)
CREATE POLICY "Admins can manage all reviews" ON reviews
    FOR ALL USING (true); -- TODO: Add admin role check
