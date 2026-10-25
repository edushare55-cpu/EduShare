/**
 * prisma/seed.ts
 *
 * This seed script ensures the database is clean and only provisions the root Admin account.
 * All mocked data (students, faculty, classes, etc.) has been removed to allow for a clean slate
 * for end-to-end testing and production provisioning.
 */

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting EduShare seed (Clean Slate Mode)...\n");

  console.log("🧹 Clearing all existing data...");
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postFile.deleteMany();
  await prisma.post.deleteMany();
  await prisma.classMembership.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Database wiped clean.\n");

  console.log("👑 Provisioning root Admin account...");
  await prisma.user.create({
    data: {
      id: "admin-001", // Make sure this matches your Supabase Auth admin user ID
      email: "admin@edushare.edu",
      name: "System Administrator",
      department: "IT Department",
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log("✅ Admin account created.\n");

  console.log("═".repeat(50));
  console.log("🎉 Database is now fully empty except for the root Admin.");
  console.log("   You can now start testing by creating Faculty and Student accounts.");
  console.log("═".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
