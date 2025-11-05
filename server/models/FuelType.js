const mongoose = require('mongoose');

const fuelTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    default: 'liter'
  },
  litersPerTon: {
    type: Number,
    default: 1390, // Default for regular and super fuel
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FuelType', fuelTypeSchema);

