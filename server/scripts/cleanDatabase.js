require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { exec } = require('child_process');
const path = require('path');

// Import all models
const User = require('../models/User');
const FuelType = require('../models/FuelType');
const Pump = require('../models/Pump');
const Transaction = require('../models/Transaction');
const StockEntry = require('../models/StockEntry');
const FuelPriceHistory = require('../models/FuelPriceHistory');

const cleanDatabase = async (shouldSeed = false) => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🗑️  Starting database cleanup...\n');
    
    // Delete all data from each collection
    const collections = [
      { name: 'Transactions', model: Transaction },
      { name: 'Stock Entries', model: StockEntry },
      { name: 'Fuel Price History', model: FuelPriceHistory },
      { name: 'Pumps', model: Pump },
      { name: 'Fuel Types', model: FuelType },
      { name: 'Users', model: User }
    ];
    
    let totalDeleted = 0;
    
    for (const collection of collections) {
      const result = await collection.model.deleteMany({});
      const deletedCount = result.deletedCount || 0;
      totalDeleted += deletedCount;
      console.log(`✅ Deleted ${deletedCount} ${collection.name}`);
    }
    
    console.log(`\n✨ Database cleanup complete!`);
    console.log(`📊 Total documents deleted: ${totalDeleted}`);
    
    // Close database connection before running seed
    await mongoose.connection.close();
    
    if (shouldSeed) {
      console.log('\n🌱 Starting database seeding...\n');
      
      // Run seed script
      const seedScriptPath = path.join(__dirname, 'seedData.js');
      exec(`node ${seedScriptPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error running seed script:', error);
          process.exit(1);
        }
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        
        console.log('\n✨ Database cleaned and seeded successfully!');
        process.exit(0);
      });
    } else {
      console.log('\n⚠️  Note: All data has been removed. You may want to:');
      console.log('   1. Run "npm run create-admin" to create an admin user');
      console.log('   2. Run "npm run seed" to add sample data');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
};

// Check if seed flag is passed
const shouldSeed = process.argv.includes('--seed') || process.argv.includes('-s');

// Run the cleanup
cleanDatabase(shouldSeed);

