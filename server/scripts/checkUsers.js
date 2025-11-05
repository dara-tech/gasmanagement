require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const checkUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gas-station');
    console.log('Connected to MongoDB');
    
    // Get all users
    const users = await User.find({});
    console.log(`\nTotal users in database: ${users.length}`);
    
    if (users.length === 0) {
      console.log('❌ No users found in the database!');
    } else {
      console.log('\nUsers found:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Created: ${user.createdAt}`);
      });
    }
    
    // Check specifically for admin
    const admin = await User.findOne({ username: 'admin' });
    if (admin) {
      console.log('\n✅ Admin user exists!');
    } else {
      console.log('\n❌ Admin user NOT found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
};

checkUsers();

