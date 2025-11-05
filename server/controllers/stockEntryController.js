const StockEntry = require('../models/StockEntry');
const FuelType = require('../models/FuelType');
const Pump = require('../models/Pump');

const getAllStockEntries = async (req, res) => {
  try {
    const stockEntries = await StockEntry.find()
      .populate('fuelTypeId')
      .populate('pumpId')
      .sort({ date: -1 });
    res.json(stockEntries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStockEntryById = async (req, res) => {
  try {
    const stockEntry = await StockEntry.findById(req.params.id)
      .populate('fuelTypeId')
      .populate('pumpId');
    if (!stockEntry) {
      return res.status(404).json({ message: 'មិនឃើញព័ត៌មានស្តុក' });
    }
    res.json(stockEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createStockEntry = async (req, res) => {
  try {
    const { fuelTypeId, pumpId, tons, pricePerLiter, date, notes } = req.body;
    
    // Get fuel type to get conversion rate
    const fuelType = await FuelType.findById(fuelTypeId);
    if (!fuelType) {
      return res.status(404).json({ message: 'មិនឃើញប្រភេទសាំង' });
    }

    // Get pump
    const pump = await Pump.findById(pumpId);
    if (!pump) {
      return res.status(404).json({ message: 'មិនឃើញស្តុកសាំង' });
    }

    // Convert tons to liters
    const litersPerTon = fuelType.litersPerTon || 1390; // Default conversion
    const liters = tons * litersPerTon;

    // Calculate total cost
    const price = pricePerLiter ? parseFloat(pricePerLiter) : 0;
    const totalCost = liters * price;

    // Use provided date or current date
    const stockDate = date ? new Date(date) : new Date();

    const stockEntry = new StockEntry({
      fuelTypeId,
      pumpId,
      tons,
      liters,
      pricePerLiter: price,
      totalCost,
      date: stockDate,
      notes
    });

    await stockEntry.save();

    // Update pump stock (increase by liters added)
    pump.stockLiters = (pump.stockLiters || 0) + liters;
    await pump.save();

    const populatedStockEntry = await StockEntry.findById(stockEntry._id)
      .populate('fuelTypeId')
      .populate('pumpId');

    res.status(201).json(populatedStockEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateStockEntry = async (req, res) => {
  try {
    const { fuelTypeId, pumpId, tons, pricePerLiter, date, notes } = req.body;
    
    const stockEntry = await StockEntry.findById(req.params.id);
    if (!stockEntry) {
      return res.status(404).json({ message: 'មិនឃើញព័ត៌មានស្តុក' });
    }

    // Get fuel type to get conversion rate
    const fuelType = await FuelType.findById(fuelTypeId || stockEntry.fuelTypeId);
    if (!fuelType) {
      return res.status(404).json({ message: 'មិនឃើញប្រភេទសាំង' });
    }

    // Calculate new liters
    const litersPerTon = fuelType.litersPerTon || 1390;
    const newTons = tons || stockEntry.tons;
    const newLiters = newTons * litersPerTon;

    // Calculate total cost
    const newPricePerLiter = pricePerLiter !== undefined ? pricePerLiter : stockEntry.pricePerLiter;
    const newTotalCost = newLiters * newPricePerLiter;

    // Get old pump and new pump
    const oldPumpId = stockEntry.pumpId.toString();
    const newPumpId = pumpId || stockEntry.pumpId;
    const oldPump = await Pump.findById(oldPumpId);
    const newPump = await Pump.findById(newPumpId);

    if (!oldPump || !newPump) {
      return res.status(404).json({ message: 'មិនឃើញស្តុកសាំង' });
    }

    // Adjust stock: remove old liters from old pump, add new liters to new pump
    if (oldPumpId !== newPumpId.toString()) {
      // Pump changed
      oldPump.stockLiters = Math.max(0, (oldPump.stockLiters || 0) - stockEntry.liters);
      newPump.stockLiters = (newPump.stockLiters || 0) + newLiters;
      await oldPump.save();
      await newPump.save();
    } else {
      // Same pump - adjust by difference
      const stockDifference = newLiters - stockEntry.liters;
      oldPump.stockLiters = Math.max(0, (oldPump.stockLiters || 0) + stockDifference);
      await oldPump.save();
    }

    // Update stock entry
    stockEntry.fuelTypeId = fuelTypeId || stockEntry.fuelTypeId;
    stockEntry.pumpId = pumpId || stockEntry.pumpId;
    stockEntry.tons = newTons;
    stockEntry.liters = newLiters;
    stockEntry.pricePerLiter = newPricePerLiter;
    stockEntry.totalCost = newTotalCost;
    if (date) {
      stockEntry.date = new Date(date);
    }
    if (notes !== undefined) {
      stockEntry.notes = notes;
    }

    await stockEntry.save();
    const populatedStockEntry = await StockEntry.findById(stockEntry._id)
      .populate('fuelTypeId')
      .populate('pumpId');

    res.json(populatedStockEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteStockEntry = async (req, res) => {
  try {
    const stockEntry = await StockEntry.findById(req.params.id);
    if (!stockEntry) {
      return res.status(404).json({ message: 'មិនឃើញព័ត៌មានស្តុក' });
    }

    // Return stock to pump (decrease by liters)
    const pump = await Pump.findById(stockEntry.pumpId);
    if (pump) {
      pump.stockLiters = Math.max(0, (pump.stockLiters || 0) - stockEntry.liters);
      await pump.save();
    }

    await StockEntry.findByIdAndDelete(req.params.id);
    res.json({ message: 'លុបព័ត៌មានស្តុកដោយជោគជ័យ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllStockEntries,
  getStockEntryById,
  createStockEntry,
  updateStockEntry,
  deleteStockEntry
};

