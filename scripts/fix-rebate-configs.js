const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fixing rebate configurations...');

    // Get all products
    const products = await prisma.product.findMany();

    if (products.length === 0) {
      console.log('No products found.');
      return;
    }

    console.log(`Found ${products.length} products. Updating rebate configs...`);

    for (const product of products) {
      console.log(`\nUpdating rebate configs for ${product.name} (ID: ${product.id})...`);

      // Get existing rebate configs
      const existingConfigs = await prisma.rebateConfig.findMany({
        where: { productId: product.id },
      });

      console.log(`Found ${existingConfigs.length} existing configs.`);

      // Delete existing configs
      if (existingConfigs.length > 0) {
        await prisma.rebateConfig.deleteMany({
          where: { productId: product.id },
        });
        console.log(`Deleted ${existingConfigs.length} existing configs.`);
      }

      // Create percentage-based rebate configs for levels 1-5
      for (let level = 1; level <= 5; level++) {
        const percentage = 10 - (level - 1) * 1.5; // 10%, 8.5%, 7%, 5.5%, 4%

        await prisma.rebateConfig.create({
          data: {
            productId: product.id,
            level,
            percentage,
          },
        });

        console.log(`Created percentage-based rebate config for level ${level}: ${percentage}%`);
      }

      // Create percentage-based rebate configs for levels 6-10 (since fixedAmount is not in the schema)
      for (let level = 6; level <= 10; level++) {
        const percentage = 3 - (level - 6) * 0.5; // 3%, 2.5%, 2%, 1.5%, 1%

        await prisma.rebateConfig.create({
          data: {
            productId: product.id,
            level,
            percentage,
          },
        });

        console.log(`Created percentage-based rebate config for level ${level}: ${percentage}%`);
      }
    }

    console.log('\nRebate configurations updated successfully!');

  } catch (error) {
    console.error('Error fixing rebate configurations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
