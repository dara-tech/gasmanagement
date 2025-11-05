const mongoose = require('mongoose');

const pumpSchema = new mongoose.Schema({
  pumpNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  fuelTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FuelType',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  stockLiters: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pump', pumpSchema);

