/**
 * Test API Script
 * 
 * This script tests the API endpoints for login and registration.
 */

const fetch = require('node-fetch');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Base URL
const BASE_URL = 'http://localhost:3000';

async function testRegistration() {
  console.log('Testing registration API...');
  
  const userData = {
    name: 'API Test User',
    email: 'apitest@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    phone: '1234567890',
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    console.log(`Registration API response status: ${response.status}`);
    console.log('Response data:', data);
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('Error testing registration API:', error);
    return { success: false, error: error.message };
  }
}

async function testLogin() {
  console.log('\nTesting login API...');
  
  const loginData = {
    email: 'test@example.com',
    password: 'password123',
    csrfToken: 'test-csrf-token',
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }
    
    console.log(`Login API response status: ${response.status}`);
    console.log('Response data:', data);
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('Error testing login API:', error);
    return { success: false, error: error.message };
  }
}

async function testGetUsers() {
  console.log('\nTesting get users API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/users`);
    const data = await response.json();
    
    console.log(`Get users API response status: ${response.status}`);
    console.log(`Found ${data.users?.length || 0} users`);
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('Error testing get users API:', error);
    return { success: false, error: error.message };
  }
}

// Run the tests
async function runTests() {
  try {
    // Test registration
    const registrationResult = await testRegistration();
    
    // Test login
    const loginResult = await testLogin();
    
    // Test get users
    const getUsersResult = await testGetUsers();
    
    console.log('\nAPI tests completed!');
  } catch (error) {
    console.error('Error running API tests:', error);
  }
}

// Run the tests
runTests();
