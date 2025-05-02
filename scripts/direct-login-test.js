/**
 * Direct Login Test Script
 * 
 * This script tests the login process directly by simulating the NextAuth.js authorize function.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Prisma client
const prisma = new PrismaClient();

async function testDirectLogin(email, password) {
  try {
    console.log(`Testing direct login for email: ${email}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        rankId: true,
      },
    });
    
    if (!user) {
      console.error(`User with email ${email} not found!`);
      return { success: false, error: 'User not found' };
    }
    
    console.log(`Found user: ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Rank: ${user.rankId}`);
    console.log(`Stored password hash: ${user.password}`);
    
    // Test password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log(`Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid password' };
    }
    
    // Create a new password hash for comparison
    const newHash = await bcrypt.hash(password, 10);
    console.log(`New hash for '${password}': ${newHash}`);
    
    return { 
      success: true, 
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        rankId: user.rankId,
      }
    };
  } catch (error) {
    console.error('Error testing direct login:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Test credentials
const testCredentials = [
  { email: 'admin@example.com', password: 'admin123' },
  { email: 'test@example.com', password: 'password123' },
  { email: 'apitest@example.com', password: 'password123' },
];

// Run the tests
async function runTests() {
  console.log('Running direct login tests...\n');
  
  for (const cred of testCredentials) {
    console.log(`\n--- Testing ${cred.email} ---`);
    const result = await testDirectLogin(cred.email, cred.password);
    console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILURE'}`);
    if (!result.success) {
      console.log(`Error: ${result.error}`);
    } else {
      console.log(`User: ${JSON.stringify(result.user, null, 2)}`);
    }
    console.log('-'.repeat(30));
  }
}

// Run the tests
runTests()
  .then(() => {
    console.log('\nDirect login tests completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
