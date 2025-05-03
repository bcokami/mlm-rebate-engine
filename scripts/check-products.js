const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking products in the database...');

    // Get all products
    const products = await prisma.product.findMany();
    
    console.log(`Found ${products.length} products:`);
    
    if (products.length === 0) {
      console.log('No products found. Creating sample products...');
      
      // Create sample products
      const sampleProducts = [
        {
          name: 'Premium Moringa Capsules',
          description: 'High-potency Moringa Oleifera capsules packed with essential nutrients and antioxidants.',
          price: 1200,
          isActive: true,
        },
        {
          name: 'Sambong-Banaba Tea',
          description: 'Traditional herbal tea blend that helps support healthy blood sugar levels and kidney function.',
          price: 850,
          isActive: true,
        },
        {
          name: 'Mangosteen Extract',
          description: 'Pure mangosteen extract known for its powerful anti-inflammatory and antioxidant properties.',
          price: 1500,
          isActive: true,
        },
      ];
      
      for (const product of sampleProducts) {
        const createdProduct = await prisma.product.create({
          data: product,
        });
        
        console.log(`Created product: ${createdProduct.name} (ID: ${createdProduct.id})`);
        
        // Create rebate configs for this product
        console.log(`Creating rebate configs for ${createdProduct.name}...`);
        
        // Create percentage-based rebate configs for levels 1-5
        for (let level = 1; level <= 5; level++) {
          const percentage = 10 - (level - 1) * 1.5; // 10%, 8.5%, 7%, 5.5%, 4%
          
          await prisma.rebateConfig.create({
            data: {
              productId: createdProduct.id,
              level,
              rewardType: 'percentage',
              percentage,
              fixedAmount: 0,
            },
          });
          
          console.log(`Created percentage-based rebate config for level ${level}: ${percentage}%`);
        }
        
        // Create fixed-amount rebate config for level 6
        await prisma.rebateConfig.create({
          data: {
            productId: createdProduct.id,
            level: 6,
            rewardType: 'fixed',
            percentage: 0,
            fixedAmount: createdProduct.price * 0.02, // 2% of product price as fixed amount
          },
        });
        
        console.log(`Created fixed-amount rebate config for level 6: ₱${(createdProduct.price * 0.02).toFixed(2)}`);
      }
      
      console.log('Sample products and rebate configs created successfully!');
    } else {
      // Display existing products
      for (const product of products) {
        console.log(`- ${product.name} (ID: ${product.id}, Price: ₱${product.price}, Active: ${product.isActive})`);
        
        // Check rebate configs for this product
        const rebateConfigs = await prisma.rebateConfig.findMany({
          where: { productId: product.id },
          orderBy: { level: 'asc' },
        });
        
        console.log(`  Found ${rebateConfigs.length} rebate configs:`);
        
        for (const config of rebateConfigs) {
          if (config.rewardType === 'percentage') {
            console.log(`  - Level ${config.level}: ${config.percentage}% (${config.rewardType})`);
          } else {
            console.log(`  - Level ${config.level}: ₱${config.fixedAmount} (${config.rewardType})`);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error checking products:', error);
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
