const { PrismaClient } = require('@prisma/client');

async function testConnection(url, name) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });

  try {
    console.log(`Testing ${name}...`);
    await prisma.$connect();
    const count = await prisma.user.count();
    console.log(`${name} SUCCESS! Users count: ${count}`);
    await prisma.$disconnect();
    return true;
  } catch (err) {
    console.error(`${name} FAILED:`, err.message);
    await prisma.$disconnect();
    return false;
  }
}

async function main() {
  const poolerUrl = "postgresql://postgres.mxbayvsqbhverjnjqodu:Lomki09187176680@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const directUrl = "postgresql://postgres.mxbayvsqbhverjnjqodu:Lomki09187176680@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";
  const oldPoolerUrl = "postgresql://postgres.mxbayvsqbhverjnjqodu:Lomki09187176680@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

  await testConnection(poolerUrl, "AWS-0 POOLER (6543)");
  await testConnection(directUrl, "AWS-0 DIRECT (5432)");
  await testConnection(oldPoolerUrl, "AWS-1 POOLER (6543)");
}

main();
