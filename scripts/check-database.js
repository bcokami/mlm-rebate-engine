const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking database schema...');

    // Get database schema
    const models = Object.keys(prisma);
    console.log('Available models:', models.filter(m => !m.startsWith('_')));

    // Check RebateConfig model
    console.log('\nChecking RebateConfig model...');
    const rebateConfigFields = await prisma.$queryRaw`
      PRAGMA table_info(RebateConfig);
    `;
    console.log('RebateConfig fields:', rebateConfigFields);

    // Check Product model
    console.log('\nChecking Product model...');
    const productFields = await prisma.$queryRaw`
      PRAGMA table_info(Product);
    `;
    console.log('Product fields:', productFields);

  } catch (error) {
    console.error('Error checking database schema:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\nDatabase check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database check failed:', error);
    process.exit(1);
  });
