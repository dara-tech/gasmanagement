const mongoose = require('mongoose');

const fuelPriceHistorySchema = new mongoose.Schema({
  fuelTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FuelType',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one price per fuel type per day
fuelPriceHistorySchema.index({ fuelTypeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('FuelPriceHistory', fuelPriceHistorySchema);

