/**
 * Verify Test User Login
 *
 * This script verifies that a test user can log in by checking the password hash.
 * It's useful for debugging login issues with test users.
 */

import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs'; // Changed from import * as bcryptjs
import * as readline from 'readline';

const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  try {
    console.log('Test User Login Verification');
    console.log('============================');

    // Get email and password from user input
    const email = await prompt('Enter test user email: ');
    const password = await prompt('Enter test user password: ');

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        testData: true
      }
    });

    if (!user) {
      console.error(`User with email ${email} not found in the database.`);
      return;
    }

    console.log('\nUser found:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Name: ${user.name}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Test Data: ${user.testData ? 'Yes' : 'No'}`);

    // Verify password
    console.log('\nVerifying password...');
    console.log(`- Stored password hash: ${user.password.substring(0, 10)}...`);

    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (isPasswordValid) {
      console.log('\n✅ Password is valid! This user should be able to log in.');
    } else {
      console.log('\n❌ Password is invalid! This user will not be able to log in with the provided password.');

      // Suggest fixing the password
      const fixPassword = await prompt('\nWould you like to update the password for this user? (y/n): ');

      if (fixPassword.toLowerCase() === 'y') {
        // Hash the new password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Update the user's password
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });

        console.log(`\n✅ Password updated successfully for ${user.email}.`);
        console.log('The user should now be able to log in with the provided password.');
      }
    }
  } catch (error) {
    console.error('Error verifying test user:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch(console.error);
