#!/usr/bin/env node

/**
 * Test script to verify Vercel KV connection
 * Run: node scripts/test-kv-connection.js
 */

const { kv } = require('@vercel/kv');

async function testKVConnection() {
  console.log('🔍 Testing Vercel KV connection...');
  
  try {
    // Check if environment variables are set
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error('❌ KV environment variables not set');
      console.log('Please set KV_REST_API_URL and KV_REST_API_TOKEN in your .env.local file');
      process.exit(1);
    }

    console.log('✅ KV environment variables found');
    console.log(`📍 KV URL: ${process.env.KV_REST_API_URL.substring(0, 50)}...`);

    // Test basic set operation
    const testKey = 'connection-test';
    const testValue = `Test connection at ${new Date().toISOString()}`;
    
    console.log('📝 Testing SET operation...');
    await kv.set(testKey, testValue);
    console.log('✅ SET operation successful');

    // Test get operation
    console.log('📖 Testing GET operation...');
    const retrievedValue = await kv.get(testKey);
    console.log('✅ GET operation successful');
    console.log(`📄 Retrieved value: ${retrievedValue}`);

    // Test delete operation
    console.log('🗑️  Testing DELETE operation...');
    await kv.del(testKey);
    console.log('✅ DELETE operation successful');

    // Verify deletion
    console.log('🔍 Verifying deletion...');
    const deletedValue = await kv.get(testKey);
    if (deletedValue === null) {
      console.log('✅ Value successfully deleted');
    } else {
      console.log('❌ Value not deleted properly');
    }

    console.log('\n🎉 All KV operations completed successfully!');
    console.log('✅ Vercel KV is properly configured and working');
    
  } catch (error) {
    console.error('❌ KV connection test failed:', error.message);
    console.error('\n📋 Troubleshooting steps:');
    console.error('1. Check if KV database is created in Vercel Dashboard');
    console.error('2. Verify KV_REST_API_URL and KV_REST_API_TOKEN are correct');
    console.error('3. Ensure the KV database is linked to your project');
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testKVConnection().catch(console.error);
