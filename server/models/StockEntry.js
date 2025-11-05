const mongoose = require('mongoose');

const stockEntrySchema = new mongoose.Schema({
  fuelTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FuelType',
    required: true
  },
  pumpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pump',
    required: true
  },
  tons: {
    type: Number,
    required: true,
    min: 0
  },
  liters: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerLiter: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCost: {
    type: Number,
    default: 0,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StockEntry', stockEntrySchema);

