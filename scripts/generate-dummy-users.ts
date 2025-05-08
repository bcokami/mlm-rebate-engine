/**
 * Generate Dummy Users for MLM System Testing
 *
 * This script creates a set of test users with different roles and relationships
 * for comprehensive testing of the MLM system.
 *
 * User roles include:
 * - Admin: System administrators
 * - Manager: Product and user managers
 * - Distributor: Regular distributors at different ranks
 * - Customer: Regular customers without distribution rights
 *
 * The script also creates relationships between users to test the MLM structure.
 */

import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs'; // Changed from import * as bcryptjs
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Common password for all test users
const TEST_PASSWORD = 'Test@123';
const CLEANUP_TOKEN = 'test-dummy-data-cleanup';

// User roles
enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DISTRIBUTOR = 'distributor',
  CUSTOMER = 'customer'
}

// Distributor ranks
enum DistributorRank {
  NEW = 'new',
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond'
}

// User structure for creating test users
interface TestUser {
  name: string;
  email: string;
  role: UserRole;
  rank?: DistributorRank;
  uplineEmail?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  preferredPaymentMethod?: string;
  paymentDetails?: any;
}

// Create test users data
const testUsers: TestUser[] = [
  // Admin users
  {
    name: 'Admin User',
    email: 'admin@test.com',
    role: UserRole.ADMIN
  },
  {
    name: 'Super Admin',
    email: 'superadmin@test.com',
    role: UserRole.ADMIN
  },

  // Manager users
  {
    name: 'Product Manager',
    email: 'product.manager@test.com',
    role: UserRole.MANAGER
  },
  {
    name: 'User Manager',
    email: 'user.manager@test.com',
    role: UserRole.MANAGER
  },

  // Top-level distributors (no upline)
  {
    name: 'Diamond Distributor',
    email: 'diamond@test.com',
    role: UserRole.DISTRIBUTOR,
    rank: DistributorRank.DIAMOND,
    phone: '09111111111',
    preferredPaymentMethod: 'gcash',
    paymentDetails: { gcashNumber: '09111111111' }
  },
  {
    name: 'Platinum Distributor',
    email: 'platinum@test.com',
    role: UserRole.DISTRIBUTOR,
    rank: DistributorRank.PLATINUM,
    phone: '09222222222',
    preferredPaymentMethod: 'bank',
    paymentDetails: {
      bankName: 'BDO',
      accountNumber: '1234567890',
      accountName: 'Platinum Distributor'
    }
  },

  // Second-level distributors
  {
    name: 'Gold Distributor 1',
    email: 'gold1@test.com',
    role: UserRole.DISTRIBUTOR,
    rank: DistributorRank.GOLD,
    uplineEmail: 'diamond@test.com',
    phone: '09333333331',
    preferredPaymentMethod: 'gcash',
    paymentDetails: { gcashNumber: '09333333331' }
  },
  {
    name: 'Gold Distributor 2',
    email: 'gold2@test.com',
    role: UserRole.DISTRIBUTOR,
    rank: DistributorRank.GOLD,
    uplineEmail: 'platinum@test.com',
    phone: '09333333332',
    preferredPaymentMethod: 'gcash',
    paymentDetails: { gcashNumber: '09333333332' }
  },

  // Third-level distributors
  {
    name: 'Silver Distributor 1',
    email: 'silver1@test.com',
    role: UserRole.DISTRIBUTOR,
    rank: DistributorRank.SILVER,
    uplineEmail: 'gold1@test.com',
    phone: '09444444441',
    preferredPaymentMethod: 'gcash',
    paymentDetails: { gcashNumber: '09444444441' }
  },
  {
    name: 'Silver Distributor 2',
    email: 'silver2@test.com',
    role: UserRole.DISTRIBUTOR,
    rank: DistributorRank.SILVER,
    uplineEmail: 'gold1@test.com',
    phone: '09444444442',
    preferredPaymentMethod: 'gcash',
    paymentDetails: { gcashNumber: '09444444442' }
  },
  {
    name: 'Silver Distributor 3',
    email: 'silver3@test.com',
    role: UserRole.DISTRIBUTOR,
    rank: DistributorRank.SILVER,
    uplineEmail: 'gold2@test.com',
    phone: '09444444443',
    preferredPaymentMethod: 'gcash',
    paymentDetails: { gcashNumber: '09444444443' }
  },

  // Fourth-level distributors
  {
    name: 'Bronze Distributor 1',
    email: 'bronze1@test.com',
    role: UserRole.DISTRIBUTOR,
    rank: DistributorRank.BRONZE,
    uplineEmail: 'silver1@test.com',
    phone: '09555555551',
    preferredPaymentMethod: 'gcash',
    paymentDetails: { gcashNumber: '09555555551' }
  },
  {
    name: 'Bronze Distributor 2',
    email: 'bronze2@test.com',
    role: UserRole.DISTRIBUTOR,
    rank: DistributorRank.BRONZE,
    uplineEmail: 'silver2@test.com',
    phone: '09555555552',
    preferredPaymentMethod: 'gcash',
    paymentDetails: { gcashNumber: '09555555552' }
  },
  {
    name: 'Bronze Distributor 3',
    email: 'bronze3@test.com',
    role: UserRole.DISTRIBUTOR,
    rank: DistributorRank.BRONZE,
    uplineEmail: 'silver3@test.com',
    phone: '09555555553',
    preferredPaymentMethod: 'gcash',
    paymentDetails: { gcashNumber: '09555555553' }
  },

  // Fifth-level distributors (new)
  {
    name: 'New Distributor 1',
    email: 'new1@test.com',
    role: UserRole.DISTRIBUTOR,
    rank: DistributorRank.NEW,
    uplineEmail: 'bronze1@test.com',
    phone: '09666666661',
    preferredPaymentMethod: 'gcash',
    paymentDetails: { gcashNumber: '09666666661' }
  },
  {
    name: 'New Distributor 2',
    email: 'new2@test.com',
    role: UserRole.DISTRIBUTOR,
    rank: DistributorRank.NEW,
    uplineEmail: 'bronze2@test.com',
    phone: '09666666662',
    preferredPaymentMethod: 'gcash',
    paymentDetails: { gcashNumber: '09666666662' }
  },
  {
    name: 'New Distributor 3',
    email: 'new3@test.com',
    role: UserRole.DISTRIBUTOR,
    rank: DistributorRank.NEW,
    uplineEmail: 'bronze3@test.com',
    phone: '09666666663',
    preferredPaymentMethod: 'gcash',
    paymentDetails: { gcashNumber: '09666666663' }
  },

  // Customers (no distribution rights)
  {
    name: 'Regular Customer 1',
    email: 'customer1@test.com',
    role: UserRole.CUSTOMER,
    phone: '09777777771'
  },
  {
    name: 'Regular Customer 2',
    email: 'customer2@test.com',
    role: UserRole.CUSTOMER,
    phone: '09777777772'
  }
];

// Map to store created users for upline reference
const userMap = new Map<string, any>();

// Function to create ranks if they don't exist
async function createRanks() {
  console.log('Creating ranks...');

  const ranks = [
    { name: 'New Distributor', level: 1, requirements: 'None', benefits: 'Basic commission structure', icon: '🌱' },
    { name: 'Bronze', level: 2, requirements: 'Minimum 2 direct referrals', benefits: 'Improved commission rates', icon: '🥉' },
    { name: 'Silver', level: 3, requirements: 'Minimum 5 direct referrals', benefits: 'Enhanced commission rates', icon: '🥈' },
    { name: 'Gold', level: 4, requirements: 'Minimum 10 direct referrals and 100 group volume', benefits: 'Premium commission rates', icon: '🥇' },
    { name: 'Platinum', level: 5, requirements: 'Minimum 20 direct referrals and 500 group volume', benefits: 'Elite commission rates and bonuses', icon: '💎' },
    { name: 'Diamond', level: 6, requirements: 'Minimum 50 direct referrals and 2000 group volume', benefits: 'Maximum commission rates and exclusive bonuses', icon: '💎💎' }
  ];

  const rankMap = new Map<string, number>();

  for (const rank of ranks) {
    const existingRank = await prisma.rank.findFirst({
      where: { name: rank.name }
    });

    if (existingRank) {
      console.log(`Rank ${rank.name} already exists.`);
      rankMap.set(rank.name.toLowerCase().replace(' distributor', ''), existingRank.id);
    } else {
      const newRank = await prisma.rank.create({
        data: rank
      });
      console.log(`Created rank: ${newRank.name}`);
      rankMap.set(rank.name.toLowerCase().replace(' distributor', ''), newRank.id);
    }
  }

  return rankMap;
}

// Main function to create test users
async function main() {
  console.log('Starting dummy user generation...');

  // Create ranks
  const rankMap = await createRanks();

  // Hash password using bcryptjs (same as used in the auth system)
  const hashedPassword = await bcryptjs.hash(TEST_PASSWORD, 10);

  // Create users
  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`User ${userData.email} already exists. Skipping...`);
        userMap.set(userData.email, existingUser);
        continue;
      }

      // Determine rank ID based on rank name
      let rankId = null;
      if (userData.rank && rankMap.has(userData.rank)) {
        rankId = rankMap.get(userData.rank);
      }

      // Determine upline ID
      let uplineId = null;
      if (userData.uplineEmail && userMap.has(userData.uplineEmail)) {
        uplineId = userMap.get(userData.uplineEmail).id;
      }

      // Create user
      const newUser = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          phone: userData.phone || null,
          address: userData.address || null,
          city: userData.city || null,
          region: userData.region || null,
          postalCode: userData.postalCode || null,
          rankId: rankId,
          uplineId: uplineId,
          preferredPaymentMethod: userData.preferredPaymentMethod || null,
          paymentDetails: userData.paymentDetails || null,
          testData: true,
          cleanupToken: CLEANUP_TOKEN
        }
      });

      console.log(`Created user: ${newUser.name} (${newUser.email})`);
      userMap.set(userData.email, newUser);

      // Create wallet for distributors
      if (userData.role === UserRole.DISTRIBUTOR) {
        await prisma.wallet.upsert({
          where: { userId: newUser.id },
          update: { balance: 0 },
          create: { userId: newUser.id, balance: 0 }
        });
        console.log(`Created wallet for user: ${newUser.email}`);
      }
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }

  // Generate credentials file
  generateCredentialsFile();

  console.log('Dummy user generation completed!');
}

// Function to generate a credentials file
function generateCredentialsFile() {
  const filePath = path.join(__dirname, '../tests/test-credentials.md');

  let content = `# Test Credentials for MLM System

This file contains login credentials for test users with different roles in the MLM system.
All users have the same password: \`${TEST_PASSWORD}\`

## Admin Users

| Name | Email | Role | Password |
|------|-------|------|----------|
`;

  // Add admin users
  testUsers.filter(user => user.role === UserRole.ADMIN).forEach(user => {
    content += `| ${user.name} | ${user.email} | Admin | ${TEST_PASSWORD} |\n`;
  });

  content += `
## Manager Users

| Name | Email | Role | Password |
|------|-------|------|----------|
`;

  // Add manager users
  testUsers.filter(user => user.role === UserRole.MANAGER).forEach(user => {
    content += `| ${user.name} | ${user.email} | Manager | ${TEST_PASSWORD} |\n`;
  });

  content += `
## Distributor Users

| Name | Email | Rank | Upline | Password |
|------|-------|------|--------|----------|
`;

  // Add distributor users
  testUsers.filter(user => user.role === UserRole.DISTRIBUTOR).forEach(user => {
    content += `| ${user.name} | ${user.email} | ${user.rank} | ${user.uplineEmail || 'None'} | ${TEST_PASSWORD} |\n`;
  });

  content += `
## Customer Users

| Name | Email | Role | Password |
|------|-------|------|----------|
`;

  // Add customer users
  testUsers.filter(user => user.role === UserRole.CUSTOMER).forEach(user => {
    content += `| ${user.name} | ${user.email} | Customer | ${TEST_PASSWORD} |\n`;
  });

  content += `
## MLM Structure

\`\`\`
Diamond Distributor
├── Gold Distributor 1
│   ├── Silver Distributor 1
│   │   └── Bronze Distributor 1
│   │       └── New Distributor 1
│   └── Silver Distributor 2
│       └── Bronze Distributor 2
│           └── New Distributor 2
└── Platinum Distributor
    └── Gold Distributor 2
        └── Silver Distributor 3
            └── Bronze Distributor 3
                └── New Distributor 3
\`\`\`

## Testing Notes

- Use these accounts to test different aspects of the MLM system
- The structure allows testing of up to 5 levels of the MLM hierarchy
- All distributor accounts have wallets initialized with zero balance
- For cleanup, use the script: \`npm run cleanup-dummy-users\`
`;

  fs.writeFileSync(filePath, content);
  console.log(`Credentials file generated at: ${filePath}`);
}

// Run the main function
main()
  .catch((e) => {
    console.error('Error during dummy user generation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
