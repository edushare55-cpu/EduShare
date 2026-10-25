const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.assessment.updateMany({
    data: { shuffleQuestions: true }
  });
  console.log('Updated all assessments to shuffleQuestions: true');
}
main().finally(() => prisma.$disconnect());
