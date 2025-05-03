const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking Rebate schema...');

    // Get Rebate schema
    const rebateFields = await prisma.$queryRaw`
      PRAGMA table_info(Rebate);
    `;
    console.log('Rebate fields:', rebateFields);

  } catch (error) {
    console.error('Error checking Rebate schema:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\nRebate schema check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Rebate schema check failed:', error);
    process.exit(1);
  });
