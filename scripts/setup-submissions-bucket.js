const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load .env and .env.local so credentials are available in raw Node scripts
function loadEnv(file) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
}

loadEnv(path.join(__dirname, '.env'));
loadEnv(path.join(__dirname, '.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌  Missing SUPABASE credentials in .env / .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const prisma = new PrismaClient();

async function main() {
  const bucketName = 'submissions';

  // ── 1. Ensure bucket exists ─────────────────────────────────────────────────
  console.log(`\n🔍  Checking for bucket '${bucketName}'...`);
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('❌  Error listing buckets:', listError);
    process.exit(1);
  }

  const exists = buckets.some((b) => b.name === bucketName);
  if (exists) {
    console.log(`✅  Bucket '${bucketName}' already exists.`);
  } else {
    console.log(`📦  Bucket '${bucketName}' not found — creating it...`);
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,               // files are publicly readable via their URL
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      fileSizeLimit: 52428800,    // 50 MB
    });

    if (createError) {
      console.error('❌  Error creating bucket:', createError);
      process.exit(1);
    }
    console.log(`✅  Bucket '${bucketName}' created successfully.`);
  }

  // ── 2. Apply RLS policies via Prisma (raw SQL on storage.objects) ───────────
  console.log('\n🔑  Applying RLS policies for submissions bucket...');
  try {
    // Drop any stale policies first to avoid conflicts on re-runs
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Authenticated users can upload to submissions" ON storage.objects;
    `);
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Public can read submissions" ON storage.objects;
    `);
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Users can delete own submissions" ON storage.objects;
    `);

    // INSERT: any authenticated (logged-in) user can upload
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Authenticated users can upload to submissions"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK ( bucket_id = 'submissions' );
    `);

    // SELECT: public read so download URLs work
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public can read submissions"
      ON storage.objects
      FOR SELECT
      TO public
      USING ( bucket_id = 'submissions' );
    `);

    // DELETE: users can delete their own uploads (owner = auth.uid())
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can delete own submissions"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING ( bucket_id = 'submissions' AND owner = auth.uid() );
    `);

    console.log('✅  RLS policies applied successfully!');
  } catch (err) {
    console.error('❌  Error applying SQL policies:', err);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉  submissions bucket is ready. Students can now upload files.\n');
}

main();
