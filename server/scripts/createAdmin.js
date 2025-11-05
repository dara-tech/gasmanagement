require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gas-station');
    console.log('Connected to MongoDB');

    // Check if admin already exists and delete it
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      await User.deleteOne({ username: 'admin' });
      console.log('Existing admin user deleted.');
    }

    // Create admin user
    const admin = new User({
      username: 'admin',
      password: 'admin123'
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();

