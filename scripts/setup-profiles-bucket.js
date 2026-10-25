const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].trim();
  return acc;
}, {});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const prisma = new PrismaClient();

async function main() {
  const bucketName = 'profiles';
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
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    });
    
    if (error) {
      console.error("Error creating bucket:", error);
      process.exit(1);
    }
    console.log(`Bucket '${bucketName}' created successfully.`);
  }

  console.log(`Adding RLS policies to storage.objects for ${bucketName}...`);

  try {
    // Drop existing policies just in case to avoid conflicts
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Allow public uploads to profiles" ON storage.objects;
    `);
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Allow public reads for profiles" ON storage.objects;
    `);
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Allow public updates to profiles" ON storage.objects;
    `);

    // Create policy to allow anonymous/public uploads to the profiles bucket
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public uploads to profiles"
      ON storage.objects
      FOR INSERT
      TO public
      WITH CHECK ( bucket_id = 'profiles' );
    `);

    // Create policy to allow public reads
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public reads for profiles"
      ON storage.objects
      FOR SELECT
      TO public
      USING ( bucket_id = 'profiles' );
    `);

    // Create policy to allow updates
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public updates to profiles"
      ON storage.objects
      FOR UPDATE
      TO public
      USING ( bucket_id = 'profiles' );
    `);

    console.log(`Successfully created RLS policies for the ${bucketName} bucket!`);
  } catch (error) {
    console.error("Error executing SQL:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
