require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Import all models
const FuelType = require('../models/FuelType');
const Pump = require('../models/Pump');
const Transaction = require('../models/Transaction');
const StockEntry = require('../models/StockEntry');
const FuelPriceHistory = require('../models/FuelPriceHistory');

// Fuel types data
const FUEL_TYPES = [
  { name: 'ធម្មតា', price: 0.85, litersPerTon: 1390 }, // Regular
  { name: 'ស៊ុបពែ', price: 0.95, litersPerTon: 1390 }, // Super
  { name: 'ម៉ាស៊ូត', price: 0.75, litersPerTon: 1200 }  // Diesel
];

// Helper function to generate random number between min and max
const random = (min, max) => Math.random() * (max - min) + min;

// Helper function to add days to date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Helper function to get start of day
const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('🌱 Starting data seeding...\n');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await Transaction.deleteMany({});
    await StockEntry.deleteMany({});
    await FuelPriceHistory.deleteMany({});
    await Pump.deleteMany({});
    await FuelType.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // 1. Create Fuel Types
    console.log('📦 Creating fuel types...');
    const fuelTypes = [];
    for (const fuelTypeData of FUEL_TYPES) {
      const fuelType = new FuelType(fuelTypeData);
      await fuelType.save();
      fuelTypes.push(fuelType);
      console.log(`  ✅ Created: ${fuelType.name} - $${fuelType.price}/liter`);
    }
    console.log(`✅ Created ${fuelTypes.length} fuel types\n`);

    // 2. Create Pumps (2 pumps per fuel type)
    console.log('⛽ Creating pumps...');
    const pumps = [];
    for (const fuelType of fuelTypes) {
      for (let i = 1; i <= 2; i++) {
        const pump = new Pump({
          pumpNumber: `${fuelType.name}-${i}`,
          fuelTypeId: fuelType._id,
          status: 'active',
          stockLiters: random(5000, 10000) // Initial stock
        });
        await pump.save();
        pumps.push(pump);
        console.log(`  ✅ Created: ${pump.pumpNumber} (Stock: ${pump.stockLiters.toFixed(2)}L)`);
      }
    }
    console.log(`✅ Created ${pumps.length} pumps\n`);

    // 3. Create Price History for 1 year (daily prices)
    console.log('💰 Creating price history (1 year)...');
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setHours(0, 0, 0, 0);

    let priceHistoryCount = 0;
    for (let day = 0; day < 365; day++) {
      const currentDate = addDays(startDate, day);
      
      for (const fuelType of fuelTypes) {
        // Vary price slightly (±5%) from base price
        const basePrice = fuelType.price;
        const variation = random(-0.05, 0.05);
        const dailyPrice = basePrice * (1 + variation);
        
        // Check if price history already exists for this date
        const existingPrice = await FuelPriceHistory.findOne({
          fuelTypeId: fuelType._id,
          date: startOfDay(currentDate)
        });

        if (!existingPrice) {
          const priceHistory = new FuelPriceHistory({
            fuelTypeId: fuelType._id,
            price: parseFloat(dailyPrice.toFixed(4)),
            date: startOfDay(currentDate),
            notes: day === 0 ? 'Initial price' : null
          });
          await priceHistory.save();
          priceHistoryCount++;
        }
      }
      
      // Progress indicator
      if ((day + 1) % 50 === 0) {
        console.log(`  📅 Processed ${day + 1}/365 days...`);
      }
    }
    console.log(`✅ Created ${priceHistoryCount} price history entries\n`);

    // 4. Create Stock Entries (every 3-5 days)
    console.log('📥 Creating stock entries...');
    let stockEntryCount = 0;
    const stockEntries = [];

    for (let day = 0; day < 365; day += Math.floor(random(3, 6))) {
      const currentDate = addDays(startDate, day);
      
      for (const pump of pumps) {
        const fuelType = fuelTypes.find(ft => ft._id.toString() === pump.fuelTypeId.toString());
        if (!fuelType) continue;

        // Get current price for this date
        const priceHistory = await FuelPriceHistory.findOne({
          fuelTypeId: fuelType._id,
          date: { $lte: startOfDay(currentDate) }
        }).sort({ date: -1 });

        const pricePerLiter = priceHistory ? priceHistory.price : fuelType.price;
        
        // Stock entry: 5000-15000 liters
        const liters = random(5000, 15000);
        const totalCost = liters * pricePerLiter * 0.95; // 5% discount on bulk purchase

        const stockEntry = new StockEntry({
          fuelTypeId: fuelType._id,
          pumpId: pump._id,
          liters: parseFloat(liters.toFixed(2)),
          pricePerLiter: parseFloat(pricePerLiter.toFixed(4)),
          totalCost: parseFloat(totalCost.toFixed(2)),
          date: currentDate,
          notes: `Stock replenishment`
        });
        await stockEntry.save();
        stockEntries.push(stockEntry);
        stockEntryCount++;

        // Update pump stock
        pump.stockLiters = (pump.stockLiters || 0) + liters;
        await pump.save();
      }
    }
    console.log(`✅ Created ${stockEntryCount} stock entries\n`);

    // 5. Create Transactions (throughout the year)
    console.log('💳 Creating transactions...');
    let transactionCount = 0;

    // Generate transactions for each day
    for (let day = 0; day < 365; day++) {
      const currentDate = addDays(startDate, day);
      
      // 5-20 transactions per day
      const transactionsPerDay = Math.floor(random(5, 21));
      
      for (let i = 0; i < transactionsPerDay; i++) {
        // Random pump
        const pump = pumps[Math.floor(random(0, pumps.length))];
        const fuelType = fuelTypes.find(ft => ft._id.toString() === pump.fuelTypeId.toString());
        if (!fuelType || !pump.stockLiters || pump.stockLiters <= 0) continue;

        // Get price for this date
        const priceHistory = await FuelPriceHistory.findOne({
          fuelTypeId: fuelType._id,
          date: { $lte: startOfDay(currentDate) }
        }).sort({ date: -1 });

        const priceOut = priceHistory ? priceHistory.price : fuelType.price;
        const priceIn = priceOut * 0.95; // 5% markup

        // Transaction: 10-100 liters
        const liters = Math.min(random(10, 101), pump.stockLiters);
        const total = liters * priceOut;
        const profit = liters * (priceOut - priceIn);

        // Random discount (0-10% chance, 0-5% discount)
        const hasDiscount = Math.random() < 0.1;
        const discountPercent = hasDiscount ? random(0, 0.05) : 0;
        const discount = total * discountPercent;
        const finalTotal = total - discount;

        // Random time during the day
        const transactionDate = new Date(currentDate);
        transactionDate.setHours(Math.floor(random(6, 22)), Math.floor(random(0, 60)), 0, 0);

        const transaction = new Transaction({
          pumpId: pump._id,
          fuelTypeId: fuelType._id,
          liters: parseFloat(liters.toFixed(2)),
          price: parseFloat(priceOut.toFixed(4)),
          priceIn: parseFloat(priceIn.toFixed(4)),
          priceOut: parseFloat(priceOut.toFixed(4)),
          discount: parseFloat(discount.toFixed(2)),
          discountType: 'percentage',
          profit: parseFloat(profit.toFixed(2)),
          total: parseFloat(finalTotal.toFixed(2)),
          date: transactionDate
        });
        await transaction.save();
        transactionCount++;

        // Update pump stock
        pump.stockLiters = Math.max(0, (pump.stockLiters || 0) - liters);
        await pump.save();
      }

      // Progress indicator
      if ((day + 1) % 50 === 0) {
        console.log(`  📅 Processed ${day + 1}/365 days...`);
      }
    }
    console.log(`✅ Created ${transactionCount} transactions\n`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Fuel Types:     ${fuelTypes.length}`);
    console.log(`Pumps:          ${pumps.length}`);
    console.log(`Price History:  ${priceHistoryCount}`);
    console.log(`Stock Entries:  ${stockEntryCount}`);
    console.log(`Transactions:   ${transactionCount}`);
    console.log('='.repeat(60));
    console.log('✅ Data seeding completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seed
seedData();

