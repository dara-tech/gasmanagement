require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const recreateStockEntries = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🗑️  Dropping stockentries collection...');
    
    // Get the collection
    const db = mongoose.connection.db;
    const collectionName = 'stockentries';
    
    // Check if collection exists and get count
    const collections = await db.listCollections({ name: collectionName }).toArray();
    let documentCount = 0;
    
    if (collections.length > 0) {
      documentCount = await db.collection(collectionName).countDocuments();
      console.log(`   Found ${documentCount} document(s) in the collection`);
      
      // Drop the collection
      await db.collection(collectionName).drop();
      console.log('   ✅ Collection dropped successfully');
    } else {
      console.log('   ℹ️  Collection does not exist');
    }
    
    // The collection will be automatically recreated when the first document is inserted
    // with the correct schema from the StockEntry model
    
    console.log('\n✨ Collection will be recreated automatically with the correct schema');
    console.log('   when you create the first stock entry.');
    
    if (documentCount > 0) {
      console.log('\n⚠️  WARNING: All stock entry data has been deleted!');
      console.log('   You will need to re-enter stock entries.');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Done!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error recreating collection:', error);
    process.exit(1);
  }
};

// Run the script
recreateStockEntries();

