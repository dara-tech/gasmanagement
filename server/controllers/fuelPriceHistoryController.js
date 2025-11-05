const FuelPriceHistory = require('../models/FuelPriceHistory');
const FuelType = require('../models/FuelType');

// Get price for a specific date
const getPriceByDate = async (req, res) => {
  try {
    const { fuelTypeId, date } = req.params;
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    const endDate = new Date(searchDate);
    endDate.setHours(23, 59, 59, 999);

    const priceHistory = await FuelPriceHistory.findOne({
      fuelTypeId,
      date: { $gte: searchDate, $lte: endDate }
    }).sort({ date: -1 });

    if (priceHistory) {
      return res.json(priceHistory);
    }

    // If no price history, return the default price from FuelType
    const fuelType = await FuelType.findById(fuelTypeId);
    if (!fuelType) {
      return res.status(404).json({ message: 'មិនឃើញប្រភេទសាំង' });
    }

    res.json({
      fuelTypeId: fuelType._id,
      price: fuelType.price || 0,
      date: searchDate,
      isDefault: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all prices for a fuel type
const getPricesByFuelType = async (req, res) => {
  try {
    const { fuelTypeId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { fuelTypeId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const prices = await FuelPriceHistory.find(query)
      .sort({ date: -1 })
      .limit(100); // Limit to recent 100 entries

    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Set price for a specific date
const setPriceForDate = async (req, res) => {
  try {
    const { fuelTypeId } = req.params;
    const { price, date, notes } = req.body;

    // Verify fuel type exists
    const fuelType = await FuelType.findById(fuelTypeId);
    if (!fuelType) {
      return res.status(404).json({ message: 'មិនឃើញប្រភេទសាំង' });
    }

    // Set date to start of day in UTC to avoid timezone issues
    // Parse the date string (YYYY-MM-DD) and create UTC date
    const [year, month, day] = date.split('-').map(Number);
    const priceDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // Find or create price history entry
    const priceHistory = await FuelPriceHistory.findOneAndUpdate(
      {
        fuelTypeId,
        date: {
          $gte: new Date(priceDate),
          $lt: new Date(priceDate.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      {
        fuelTypeId,
        price,
        date: priceDate,
        notes: notes || ''
      },
      {
        new: true,
        upsert: true
      }
    );

    res.json(priceHistory);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: 'តម្លៃសម្រាប់ថ្ងៃនេះមានរួចហើយ' });
    }
    res.status(400).json({ message: error.message });
  }
};

// Get current price (latest price or default)
const getCurrentPrice = async (req, res) => {
  try {
    const { fuelTypeId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get latest price history for today or earlier
    const latestPrice = await FuelPriceHistory.findOne({
      fuelTypeId,
      date: { $lte: endOfDay }
    }).sort({ date: -1 });

    if (latestPrice) {
      return res.json({
        price: latestPrice.price,
        date: latestPrice.date,
        isDefault: false
      });
    }

    // If no price history, return default price
    const fuelType = await FuelType.findById(fuelTypeId);
    if (!fuelType) {
      return res.status(404).json({ message: 'មិនឃើញប្រភេទសាំង' });
    }

    res.json({
      price: fuelType.price || 0,
      date: null,
      isDefault: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPriceByDate,
  getPricesByFuelType,
  setPriceForDate,
  getCurrentPrice
};

