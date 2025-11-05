require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Import all models
const User = require('../models/User');
const FuelType = require('../models/FuelType');
const Pump = require('../models/Pump');
const Transaction = require('../models/Transaction');
const StockEntry = require('../models/StockEntry');
const FuelPriceHistory = require('../models/FuelPriceHistory');

const checkDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('📊 Database Status Report\n');
    console.log('='.repeat(50));
    
    // Count documents in each collection
    const collections = [
      { name: 'Users', model: User },
      { name: 'Fuel Types', model: FuelType },
      { name: 'Pumps', model: Pump },
      { name: 'Stock Entries', model: StockEntry },
      { name: 'Transactions', model: Transaction },
      { name: 'Fuel Price History', model: FuelPriceHistory }
    ];
    
    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      console.log(`${collection.name.padEnd(20)}: ${count}`);
    }
    
    console.log('\n' + '='.repeat(50));
    
    // Show some details
    console.log('\n📋 Details:\n');
    
    // Fuel Types
    const fuelTypes = await FuelType.find().select('name price unit litersPerTon').lean();
    if (fuelTypes.length > 0) {
      console.log('Fuel Types:');
      fuelTypes.forEach(ft => {
        console.log(`  - ${ft.name}: $${ft.price}/${ft.unit || 'liter'}${ft.litersPerTon ? ` (${ft.litersPerTon}L/ton)` : ''}`);
      });
    }
    
    // Pumps
    const pumps = await Pump.find().populate('fuelTypeId', 'name').select('pumpNumber status stockLiters fuelTypeId').lean();
    if (pumps.length > 0) {
      console.log('\nPumps:');
      pumps.forEach(pump => {
        const fuelTypeName = pump.fuelTypeId?.name || 'N/A';
        console.log(`  - ${pump.pumpNumber}: ${fuelTypeName} (${pump.status}) - Stock: ${pump.stockLiters?.toFixed(2) || '0'}L`);
      });
    }
    
    // Recent Transactions
    const recentTransactions = await Transaction.find()
      .populate('pumpId', 'pumpNumber')
      .populate('fuelTypeId', 'name')
      .sort({ date: -1 })
      .limit(5)
      .select('date liters price total profit pumpId fuelTypeId')
      .lean();
    
    if (recentTransactions.length > 0) {
      console.log('\nRecent Transactions (last 5):');
      recentTransactions.forEach(t => {
        const date = new Date(t.date).toLocaleDateString();
        const pumpNum = t.pumpId?.pumpNumber || 'N/A';
        const fuelName = t.fuelTypeId?.name || 'N/A';
        const profit = t.profit !== undefined ? `$${t.profit.toFixed(2)}` : 'N/A';
        console.log(`  - ${date}: ${pumpNum} - ${fuelName} - ${t.liters}L - $${t.total.toFixed(2)} (Profit: ${profit})`);
      });
    }
    
    // Stock Entries
    const recentStockEntries = await StockEntry.find()
      .populate('pumpId', 'pumpNumber')
      .populate('fuelTypeId', 'name')
      .sort({ date: -1 })
      .limit(5)
      .select('date liters totalCost pumpId fuelTypeId')
      .lean();
    
    if (recentStockEntries.length > 0) {
      console.log('\nRecent Stock Entries (last 5):');
      recentStockEntries.forEach(se => {
        const date = new Date(se.date).toLocaleDateString();
        const pumpNum = se.pumpId?.pumpNumber || 'N/A';
        const fuelName = se.fuelTypeId?.name || 'N/A';
        console.log(`  - ${date}: ${pumpNum} - ${fuelName} - ${se.liters.toFixed(2)}L - $${se.totalCost.toFixed(2)}`);
      });
    }
    
    // Users
    const users = await User.find().select('username').lean();
    if (users.length > 0) {
      console.log('\nUsers:');
      users.forEach(u => {
        console.log(`  - ${u.username}`);
      });
    } else {
      console.log('\n⚠️  No users found. Run "npm run create-admin" to create an admin user.');
    }
    
    // Transaction statistics
    const transactionStats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalLiters: { $sum: '$liters' },
          totalRevenue: { $sum: '$total' },
          totalProfit: { $sum: '$profit' },
          avgProfit: { $avg: '$profit' }
        }
      }
    ]);
    
    if (transactionStats.length > 0) {
      const stats = transactionStats[0];
      console.log('\n📈 Transaction Statistics:');
      console.log(`  Total Transactions: ${stats.totalTransactions}`);
      console.log(`  Total Liters Sold: ${stats.totalLiters.toFixed(2)}L`);
      console.log(`  Total Revenue: $${stats.totalRevenue.toFixed(2)}`);
      if (stats.totalProfit !== null && stats.totalProfit !== undefined) {
        console.log(`  Total Profit: $${stats.totalProfit.toFixed(2)}`);
        console.log(`  Average Profit per Transaction: $${stats.avgProfit.toFixed(2)}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Database check complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
};

// Run the check
checkDatabase();

