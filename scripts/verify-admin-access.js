const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Verifying admin access for users...');

    // Get all users with their ranks
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
        rank: {
          select: {
            name: true,
            level: true,
          },
        },
      },
      orderBy: {
        rankId: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    console.log('\nUser Admin Access Status:');
    console.log('------------------------');
    
    // Display admin access status for each user
    users.forEach(user => {
      const hasAdminAccess = user.rankId === 6; // Diamond rank
      
      console.log(`\nUser ID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Rank: ${user.rank.name} (ID: ${user.rankId})`);
      console.log(`Admin Access: ${hasAdminAccess ? 'YES ✓' : 'NO ✗'}`);
      
      if (!hasAdminAccess) {
        console.log(`Reason: Only Diamond rank (ID: 6) users have admin access. Current rank: ${user.rank.name} (ID: ${user.rankId})`);
      }
    });

    // Count users with admin access
    const adminUsers = users.filter(user => user.rankId === 6);
    
    console.log('\nSummary:');
    console.log(`Total Users: ${users.length}`);
    console.log(`Users with Admin Access: ${adminUsers.length}`);
    console.log(`Users without Admin Access: ${users.length - adminUsers.length}`);

    if (adminUsers.length > 0) {
      console.log('\nAdmin Users:');
      adminUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email})`);
      });
    }

  } catch (error) {
    console.error('Error verifying admin access:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\nVerification completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
