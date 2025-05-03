import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding rank requirements...');

  // Get all ranks
  const ranks = await prisma.rank.findMany({
    orderBy: {
      level: 'asc',
    },
  });

  if (ranks.length === 0) {
    console.log('No ranks found. Please seed ranks first.');
    return;
  }

  // Define requirements for each rank
  const rankRequirements = [
    // Starter (level 1) - No requirements as this is the starting rank
    {
      rankId: ranks[0].id,
      requiredPersonalSales: 0,
      requiredGroupSales: 0,
      requiredDirectDownline: 0,
      requiredQualifiedDownline: 0,
      qualifiedRankId: null,
    },
    // Bronze (level 2)
    {
      rankId: ranks[1].id,
      requiredPersonalSales: 1000,
      requiredGroupSales: 5000,
      requiredDirectDownline: 2,
      requiredQualifiedDownline: 0,
      qualifiedRankId: null,
    },
    // Silver (level 3)
    {
      rankId: ranks[2].id,
      requiredPersonalSales: 2000,
      requiredGroupSales: 15000,
      requiredDirectDownline: 5,
      requiredQualifiedDownline: 2,
      qualifiedRankId: ranks[1].id, // Bronze
    },
    // Gold (level 4)
    {
      rankId: ranks[3].id,
      requiredPersonalSales: 3000,
      requiredGroupSales: 50000,
      requiredDirectDownline: 10,
      requiredQualifiedDownline: 3,
      qualifiedRankId: ranks[2].id, // Silver
    },
    // Platinum (level 5)
    {
      rankId: ranks[4].id,
      requiredPersonalSales: 5000,
      requiredGroupSales: 150000,
      requiredDirectDownline: 15,
      requiredQualifiedDownline: 5,
      qualifiedRankId: ranks[3].id, // Gold
    },
    // Diamond (level 6)
    {
      rankId: ranks[5].id,
      requiredPersonalSales: 10000,
      requiredGroupSales: 500000,
      requiredDirectDownline: 20,
      requiredQualifiedDownline: 5,
      qualifiedRankId: ranks[4].id, // Platinum
    },
  ];

  // Create or update rank requirements
  for (const requirement of rankRequirements) {
    await prisma.rankRequirement.upsert({
      where: { rankId: requirement.rankId },
      update: requirement,
      create: requirement,
    });
  }

  console.log('Rank requirements seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
