/**
 * Test runner index
 * Calls the redemption test and logs permissions for debugging
 * 
 * Usage: tsx test/index.ts
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('🧪 PulseKeeper Test Suite\n');
console.log('='.repeat(50));
console.log('Environment:');
console.log(`  SESSION_PRIVATE_KEY: ${process.env.SESSION_PRIVATE_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`  SEPOLIA_RPC_URL: ${process.env.SEPOLIA_RPC_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`  PIMLICO_API_KEY: ${process.env.PIMLICO_API_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`  PULSEKEEPER_REGISTRY_ADDRESS: ${process.env.PULSEKEEPER_REGISTRY_ADDRESS || 'Not set'}`);
console.log('='.repeat(50));

// Import and run redemption test
import('./testRedemption.js').catch(console.error);
