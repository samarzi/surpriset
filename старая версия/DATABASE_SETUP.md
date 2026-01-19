# Database Setup Guide

This guide will help you set up the Supabase database for the SURPRISET project.

## Prerequisites

- Supabase account and project
- Node.js installed
- Project dependencies installed (`npm install`)

## Setup Steps

### 1. Manual Migration (Recommended)

Since Supabase doesn't allow direct SQL execution from client code, you need to run the migration manually:

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project: `rmcedkzodiqcxnpenjld`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy the entire contents of `migrations/001_initial_schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the migration

4. **Verify Tables Created**
   - Go to "Table Editor" in the sidebar
   - You should see three tables: `products`, `orders`, `banners`

### 2. Add Sample Data

After running the migration, add sample data:

```bash
npm run db:setup
```

This will:
- Test the database connection
- Insert sample products with real images
- Insert sample banners
- Verify the setup

## Database Schema

### Products Table
- `id` (UUID, Primary Key)
- `sku` (VARCHAR, Unique)
- `name` (VARCHAR)
- `description` (TEXT)
- `composition` (TEXT, Optional)
- `price` (DECIMAL)
- `original_price` (DECIMAL, Optional)
- `images` (TEXT[])
- `tags` (TEXT[], Max 3)
- `status` (ENUM: in_stock, coming_soon, out_of_stock)
- `type` (ENUM: product, bundle)
- `is_featured` (BOOLEAN)
- `specifications` (JSONB)
- `created_at`, `updated_at` (TIMESTAMP)

### Orders Table
- `id` (UUID, Primary Key)
- `customer_name`, `customer_email`, `customer_phone` (VARCHAR)
- `customer_address` (TEXT, Optional)
- `items` (JSONB) - Array of order items
- `total` (DECIMAL)
- `status` (ENUM: pending, processing, shipped, delivered, cancelled)
- `type` (ENUM: regular, custom_bundle)
- `created_at`, `updated_at` (TIMESTAMP)

### Banners Table
- `id` (UUID, Primary Key)
- `title` (VARCHAR)
- `image` (TEXT)
- `link` (TEXT, Optional)
- `is_active` (BOOLEAN)
- `order` (INTEGER)
- `created_at` (TIMESTAMP)

## Environment Variables

Make sure your `.env` file contains:

```env
VITE_SUPABASE_URL=https://rmcedkzodiqcxnpenjld.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Operations

The project includes a comprehensive database service layer in `src/lib/database.ts`:

### Product Operations
```typescript
import { productService } from './lib/database'

// Get all products
const products = await productService.getAll()

// Search products
const results = await productService.search('шоколад')

// Get featured products
const featured = await productService.getAll({ featured: true })
```

### Order Operations
```typescript
import { orderService } from './lib/database'

// Create order
const order = await orderService.create({
  customer_name: 'Иван Иванов',
  customer_email: 'ivan@example.com',
  customer_phone: '+7 900 123-45-67',
  items: [...],
  total: 2500.00
})
```

### Banner Operations
```typescript
import { bannerService } from './lib/database'

// Get active banners
const banners = await bannerService.getAll(true)
```

## Troubleshooting

### Connection Issues
If you get connection errors:
1. Check your Supabase URL and keys
2. Verify your project is active in Supabase dashboard
3. Check network connectivity

### Migration Issues
If tables don't exist:
1. Make sure you ran the SQL migration in Supabase dashboard
2. Check for any SQL errors in the dashboard
3. Verify all tables were created in Table Editor

### Sample Data Issues
If sample data insertion fails:
1. Make sure tables exist first
2. Check for unique constraint violations
3. Clear existing data if needed

## Security Notes

- The anon key is safe to use in frontend code
- Never expose the service role key in frontend code
- Row Level Security (RLS) is enabled on all tables
- Public read access is allowed for products and banners
- Orders require proper authentication (to be implemented)

## Next Steps

After database setup:
1. Test the connection with `npm run db:setup`
2. Start the development server with `npm run dev`
3. Verify data appears in your application
4. Implement authentication for admin features