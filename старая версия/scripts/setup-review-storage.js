import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupReviewStorage() {
  try {
    console.log('🔧 Setting up review photos storage...')

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw listError
    }

    const bucketExists = buckets?.some((b) => b.name === 'review-photos')

    if (bucketExists) {
      console.log('✅ Bucket "review-photos" already exists')
      return
    }

    // Create bucket
    const { error: createError } = await supabase.storage.createBucket('review-photos', {
      public: true,
      fileSizeLimit: 10485760, // 10 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })

    if (createError) {
      throw createError
    }

    console.log('✅ Bucket "review-photos" created successfully')

    // Set up RLS policies for the bucket
    console.log('🔧 Setting up storage policies...')

    // Allow public read access
    const { error: policyError1 } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'review-photos',
      policy_name: 'Public read access',
      definition: 'true',
      operation: 'SELECT',
    })

    if (policyError1) {
      console.warn('⚠️  Could not create read policy (may already exist)')
    }

    // Allow authenticated users to upload
    const { error: policyError2 } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'review-photos',
      policy_name: 'Authenticated users can upload',
      definition: 'auth.role() = \'authenticated\'',
      operation: 'INSERT',
    })

    if (policyError2) {
      console.warn('⚠️  Could not create upload policy (may already exist)')
    }

    console.log('✅ Storage setup complete!')
  } catch (error) {
    console.error('❌ Error setting up storage:', error)
    process.exit(1)
  }
}

setupReviewStorage()
