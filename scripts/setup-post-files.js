const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

// Load environment variables from .env or .env.local if needed
// Usually next.js takes care of this, but for a raw node script we might need dotenv.
// Let's rely on Prisma loading .env for DATABASE_URL.
// But we need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
// They might be in .env.local, let's load them manually if not in process.env
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv(path.join(__dirname, '.env'));
loadEnv(path.join(__dirname, '.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const prisma = new PrismaClient();

async function main() {
  const bucketName = 'post-files';
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
      allowedMimeTypes: null, // Allow all types
    });
    
    if (error) {
      console.error("Error creating bucket:", error);
      process.exit(1);
    }
    console.log(`Bucket '${bucketName}' created successfully.`);
  }

  console.log("Adding RLS policies to storage.objects for post-files...");
  try {
    // Drop existing policies just in case to avoid conflicts
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Allow public uploads to post-files" ON storage.objects;
    `);
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Allow public reads for post-files" ON storage.objects;
    `);

    // Create policy to allow anonymous/public uploads
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public uploads to post-files"
      ON storage.objects
      FOR INSERT
      TO public
      WITH CHECK ( bucket_id = 'post-files' );
    `);

    // Create policy to allow public reads
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public reads for post-files"
      ON storage.objects
      FOR SELECT
      TO public
      USING ( bucket_id = 'post-files' );
    `);

    console.log("Successfully created RLS policies for the post-files bucket!");
  } catch (error) {
    console.error("Error executing SQL:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
