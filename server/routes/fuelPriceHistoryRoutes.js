const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getPriceByDate,
  getPricesByFuelType,
  setPriceForDate,
  getCurrentPrice
} = require('../controllers/fuelPriceHistoryController');

// Get current price for a fuel type
router.get('/:fuelTypeId/current', auth, getCurrentPrice);

// Get price for a specific date
router.get('/:fuelTypeId/date/:date', auth, getPriceByDate);

// Get all prices for a fuel type (with optional date range)
router.get('/:fuelTypeId', auth, getPricesByFuelType);

// Set price for a specific date
router.post('/:fuelTypeId', auth, setPriceForDate);

module.exports = router;

