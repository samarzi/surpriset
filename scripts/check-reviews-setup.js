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

async function checkSetup() {
  console.log('🔍 Checking reviews system setup...\n')

  try {
    // 1. Check if reviews table exists
    console.log('1️⃣ Checking reviews table...')
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id')
      .limit(1)

    if (reviewsError) {
      console.log('❌ Reviews table not found or not accessible')
      console.log('   Error:', reviewsError.message)
      console.log('   → Run: node scripts/apply-reviews-migration.js')
    } else {
      console.log('✅ Reviews table exists')
    }

    // 2. Check if storage bucket exists
    console.log('\n2️⃣ Checking storage bucket...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.log('❌ Cannot access storage')
      console.log('   Error:', bucketsError.message)
    } else {
      const reviewBucket = buckets?.find(b => b.name === 'review-photos')
      if (reviewBucket) {
        console.log('✅ Storage bucket "review-photos" exists')
        console.log('   Public:', reviewBucket.public)
      } else {
        console.log('❌ Storage bucket "review-photos" not found')
        console.log('   → Run: node scripts/setup-review-storage.js')
      }
    }

    // 3. Check RLS policies
    console.log('\n3️⃣ Checking RLS policies...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'reviews' })
      .catch(() => ({ data: null, error: null }))

    if (policiesError || !policies) {
      console.log('⚠️  Cannot check RLS policies (this is normal)')
      console.log('   RLS policies should be set by migration')
    } else {
      console.log('✅ RLS policies found:', policies.length)
    }

    // 4. Test insert (will fail if RLS is blocking)
    console.log('\n4️⃣ Testing review insert permissions...')
    const testReview = {
      product_id: '00000000-0000-0000-0000-000000000000', // fake UUID
      user_id: 'test-user-123',
      user_name: 'Test User',
      rating: 5,
      comment: 'Test review',
      photos: [],
      status: 'pending'
    }

    const { error: insertError } = await supabase
      .from('reviews')
      .insert(testReview)
      .select()

    if (insertError) {
      if (insertError.message.includes('violates foreign key constraint')) {
        console.log('✅ Insert permissions OK (failed on FK constraint as expected)')
      } else if (insertError.message.includes('policy')) {
        console.log('❌ RLS policy is blocking inserts')
        console.log('   Error:', insertError.message)
        console.log('   → Run: node scripts/apply-fix-reviews-rls.js')
      } else {
        console.log('⚠️  Insert test failed:', insertError.message)
      }
    } else {
      console.log('✅ Insert permissions OK')
      // Clean up test review
      await supabase
        .from('reviews')
        .delete()
        .eq('user_id', 'test-user-123')
    }

    console.log('\n' + '='.repeat(50))
    console.log('📋 SUMMARY')
    console.log('='.repeat(50))
    console.log('\nIf you see any ❌ above, follow the suggested commands.')
    console.log('\nCommon issues:')
    console.log('  • RLS blocking inserts → Run: node scripts/apply-fix-reviews-rls.js')
    console.log('  • Storage bucket missing → Run: node scripts/setup-review-storage.js')
    console.log('  • Reviews table missing → Run: node scripts/apply-reviews-migration.js')

  } catch (error) {
    console.error('\n❌ Error during check:', error)
  }
}

checkSetup()
