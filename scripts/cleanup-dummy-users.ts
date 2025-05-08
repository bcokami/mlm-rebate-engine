/**
 * Cleanup Dummy Users
 *
 * This script removes all test users and related data created by the generate-dummy-users script.
 * It uses the cleanupToken to identify test data for safe removal.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// Use the same cleanup token as in generate-dummy-users.ts
const CLEANUP_TOKEN = 'test-dummy-data-cleanup';

async function main() {
  console.log('Starting cleanup of dummy test users...');

  try {
    // Get all test users
    const testUsers = await prisma.user.findMany({
      where: { cleanupToken: CLEANUP_TOKEN },
      select: { id: true, email: true }
    });

    if (testUsers.length === 0) {
      console.log('No test users found with the cleanup token.');
      return;
    }

    console.log(`Found ${testUsers.length} test users to clean up.`);
    const userIds = testUsers.map(user => user.id);

    // Delete related data in the correct order to avoid foreign key constraints

    // 1. Delete wallet transactions
    const deletedWalletTransactions = await prisma.walletTransaction.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log(`Deleted ${deletedWalletTransactions.count} wallet transactions.`);

    // 2. Delete wallets
    const deletedWallets = await prisma.wallet.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log(`Deleted ${deletedWallets.count} wallets.`);

    // 3. Delete referral commissions
    const deletedReferralCommissions = await prisma.referralCommission.deleteMany({
      where: {
        OR: [
          { referrerId: { in: userIds } },
          { buyerId: { in: userIds } }
        ]
      }
    });
    console.log(`Deleted ${deletedReferralCommissions.count} referral commissions.`);

    // 4. Delete link clicks
    const deletedLinkClicks = await prisma.linkClick.deleteMany({
      where: {
        link: {
          userId: { in: userIds }
        }
      }
    });
    console.log(`Deleted ${deletedLinkClicks.count} link clicks.`);

    // 5. Delete shareable links
    const deletedShareableLinks = await prisma.shareableLink.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log(`Deleted ${deletedShareableLinks.count} shareable links.`);

    // 6. Delete rebates
    const deletedRebates = await prisma.rebate.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { purchaseUserId: { in: userIds } }
        ]
      }
    });
    console.log(`Deleted ${deletedRebates.count} rebates.`);

    // 7. Delete purchases
    const deletedPurchases = await prisma.purchase.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log(`Deleted ${deletedPurchases.count} purchases.`);

    // 8. Delete shipping addresses
    const deletedShippingAddresses = await prisma.shippingAddress.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log(`Deleted ${deletedShippingAddresses.count} shipping addresses.`);

    // 9. Delete users
    const deletedUsers = await prisma.user.deleteMany({
      where: { cleanupToken: CLEANUP_TOKEN }
    });
    console.log(`Deleted ${deletedUsers.count} test users.`);

    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
