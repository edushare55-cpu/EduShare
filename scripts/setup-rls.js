const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log("Adding RLS policies to storage.objects for lesson-videos...");

  try {
    // Drop existing policies just in case to avoid conflicts
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Allow public uploads to lesson-videos" ON storage.objects;
    `);
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Allow public reads for lesson-videos" ON storage.objects;
    `);

    // Create policy to allow anonymous/public uploads to the lesson-videos bucket
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public uploads to lesson-videos"
      ON storage.objects
      FOR INSERT
      TO public
      WITH CHECK ( bucket_id = 'lesson-videos' );
    `);

    // Create policy to allow public reads
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public reads for lesson-videos"
      ON storage.objects
      FOR SELECT
      TO public
      USING ( bucket_id = 'lesson-videos' );
    `);

    console.log("Successfully created RLS policies for the lesson-videos bucket!");
  } catch (error) {
    console.error("Error executing SQL:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
