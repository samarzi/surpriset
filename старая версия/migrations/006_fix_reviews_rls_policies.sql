-- Migration: Fix reviews RLS policies for Telegram authentication
-- Description: Updates RLS policies to work without Supabase Auth

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews within 24h" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;

-- Create new RLS policies that don't require auth.uid()

-- Anyone can view approved reviews (no auth required)
CREATE POLICY "Anyone can view approved reviews" ON reviews
    FOR SELECT USING (status = 'approved');

-- Anyone can view pending reviews (for moderation page)
CREATE POLICY "Anyone can view pending reviews" ON reviews
    FOR SELECT USING (status = 'pending');

-- Anyone can view rejected reviews (for admin)
CREATE POLICY "Anyone can view rejected reviews" ON reviews
    FOR SELECT USING (status = 'rejected');

-- Anyone can insert reviews (we validate user_id in application code)
CREATE POLICY "Anyone can insert reviews" ON reviews
    FOR INSERT WITH CHECK (true);

-- Anyone can update reviews (we validate in application code)
CREATE POLICY "Anyone can update reviews" ON reviews
    FOR UPDATE USING (true);

-- Anyone can delete reviews (we validate in application code)
CREATE POLICY "Anyone can delete reviews" ON reviews
    FOR DELETE USING (true);

-- Add comment about security
COMMENT ON TABLE reviews IS 'Product reviews with moderation system. RLS policies are permissive because authentication is handled via Telegram WebApp. Application code validates user_id matches Telegram user.';
