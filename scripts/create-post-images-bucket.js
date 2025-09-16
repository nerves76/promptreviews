/**
 * Script to create the post-images bucket in Supabase Storage
 * Creates the bucket in both local and remote Supabase instances
 * 
 * Usage: 
 * 1. Set environment variables in .env.local
 * 2. Run: node scripts/create-post-images-bucket.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createBucketInInstance(url, serviceKey, instanceName) {
  console.log(`\n🚀 Setting up ${instanceName} Supabase instance...`);
  console.log(`URL: ${url}`);
  
  const supabase = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();
    
    if (listError) {
      console.error(`❌ Error listing buckets in ${instanceName}:`, listError);
      return false;
    }
    
    const bucketExists = buckets?.some(b => b.name === 'post-images');
    
    if (bucketExists) {
      console.log(`✅ Bucket "post-images" already exists in ${instanceName}`);
      return true;
    }
    
    // Create the bucket
    const { data, error } = await supabase
      .storage
      .createBucket('post-images', {
        public: true, // Make it public so images can be accessed via URL
        fileSizeLimit: 10485760, // 10MB limit per file
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
    
    if (error) {
      console.error(`❌ Error creating bucket in ${instanceName}:`, error);
      return false;
    }
    
    console.log(`✅ Successfully created "post-images" bucket in ${instanceName}`);
    console.log('Bucket details:', data);
    return true;
    
  } catch (error) {
    console.error(`❌ Unexpected error in ${instanceName}:`, error);
    return false;
  }
}

async function main() {
  console.log('📦 Creating post-images bucket in Supabase Storage');
  console.log('================================================');
  
  let localSuccess = false;
  let remoteSuccess = false;
  
  // Create bucket in local instance
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    localSuccess = await createBucketInInstance(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      'LOCAL'
    );
  } else {
    console.log('⚠️  Local Supabase configuration not found');
  }
  
  // Create bucket in remote instance (if configured)
  // Look for remote Supabase URL (usually contains .supabase.co)
  const remoteUrl = process.env.REMOTE_SUPABASE_URL || process.env.PRODUCTION_SUPABASE_URL;
  const remoteServiceKey = process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY || process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY;
  
  if (remoteUrl && remoteServiceKey) {
    remoteSuccess = await createBucketInInstance(
      remoteUrl,
      remoteServiceKey,
      'REMOTE/PRODUCTION'
    );
  } else {
    console.log('\n⚠️  Remote/Production Supabase configuration not found');
    console.log('   To set up remote bucket, add these to .env.local:');
    console.log('   - REMOTE_SUPABASE_URL=https://your-project.supabase.co');
    console.log('   - REMOTE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  }
  
  // Summary
  console.log('\n================================================');
  console.log('📊 Summary:');
  if (localSuccess) console.log('✅ Local bucket ready');
  if (remoteSuccess) console.log('✅ Remote bucket ready');
  if (!localSuccess && !remoteSuccess) {
    console.log('❌ No buckets were created. Please check your configuration.');
  }
  
  console.log('\n📝 Note: You may want to set up RLS policies for better security:');
  console.log('   - INSERT: Authenticated users can upload their own images');
  console.log('   - SELECT: Public can view all images (since posts are public)');
  console.log('   - DELETE: Users can only delete their own images');
}

// Run the script
main().catch(console.error);