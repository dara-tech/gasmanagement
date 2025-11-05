const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  pumpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pump',
    required: true
  },
  fuelTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FuelType',
    required: true
  },
  liters: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  priceIn: {
    type: Number,
    default: 0,
    min: 0
  },
  priceOut: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['amount', 'percentage'],
    default: 'amount'
  },
  profit: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now,
    index: true // Index for faster date range queries
  }
}, {
  timestamps: true
});

// Add compound indexes for common query patterns
transactionSchema.index({ date: -1, pumpId: 1 });
transactionSchema.index({ date: -1, fuelTypeId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

