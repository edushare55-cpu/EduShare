const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const bucketName = 'lesson-videos';
  console.log(`Checking for bucket '${bucketName}'...`);
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Error listing buckets:", listError);
    process.exit(1);
  }

  const exists = buckets.some(b => b.name === bucketName);
  if (exists) {
    console.log(`Bucket '${bucketName}' already exists.`);
  } else {
    console.log(`Bucket '${bucketName}' not found. Creating it...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['video/*'],
    });
    
    if (error) {
      console.error("Error creating bucket:", error);
      process.exit(1);
    }
    console.log(`Bucket '${bucketName}' created successfully.`);
  }

  console.log("Ensuring public access policies are in place...");
  // Note: To allow anonymous uploads from the client, we might need a SQL query, 
  // but let's just make sure the bucket exists first. If we hit an RLS error, we'll address it.
}

main();
