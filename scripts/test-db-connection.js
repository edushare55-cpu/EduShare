const { PrismaClient } = require('@prisma/client');

const fs = require('fs');
const path = require('path');

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

const p = new PrismaClient();

p.$queryRawUnsafe('SELECT 1')
  .then(() => {
    console.log('✅  Database is reachable and responding correctly.');
    return p.$disconnect();
  })
  .catch((e) => {
    console.error('❌  DATABASE UNREACHABLE:', e.message);
    console.log('\n👉  Likely cause: Your Supabase free-tier project is PAUSED.');
    console.log('    Fix: Go to https://supabase.com/dashboard → select your project → click "Restore".');
    return p.$disconnect();
  });
