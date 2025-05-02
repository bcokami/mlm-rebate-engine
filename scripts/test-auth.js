/**
 * Test Authentication Script
 * 
 * This script tests the authentication directly using the Prisma client and bcrypt.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Prisma client
const prisma = new PrismaClient();

async function testAuthentication() {
  try {
    console.log('Testing authentication...');
    
    // Test credentials
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    
    if (!user) {
      console.error(`User with email ${testEmail} not found!`);
      return false;
    }
    
    console.log(`Found user: ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    console.log(`Stored password hash: ${user.password}`);
    
    // Test password
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    
    console.log(`Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      // Let's create a new hash for debugging
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log(`New hash for '${testPassword}': ${newHash}`);
      
      // Update the user's password for testing
      console.log('Updating user password for testing...');
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });
      
      console.log('Password updated successfully!');
    }
    
    return isPasswordValid;
  } catch (error) {
    console.error('Error testing authentication:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
testAuthentication()
  .then((result) => {
    console.log(`\nAuthentication test ${result ? 'passed' : 'failed'}!`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
