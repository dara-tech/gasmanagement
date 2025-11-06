const mongoose = require('mongoose');
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
    const { fuelTypeId, pumpId, liters, pricePerLiter, date, notes } = req.body;
    
    // Validate required fields
    if (!fuelTypeId || (typeof fuelTypeId === 'string' && fuelTypeId.trim() === '')) {
      return res.status(400).json({ message: 'សូមជ្រើសប្រភេទសាំង' });
    }
    if (!pumpId || (typeof pumpId === 'string' && pumpId.trim() === '')) {
      return res.status(400).json({ message: 'សូមជ្រើសស្តុកសាំង' });
    }
    
    // Check if liters is provided and valid
    if (liters === undefined || liters === null || liters === '') {
      return res.status(400).json({ message: 'សូមបញ្ចូលបរិមាណលីត្រ' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(fuelTypeId)) {
      return res.status(400).json({ message: 'លេខសម្គាល់ប្រភេទសាំងមិនត្រឹមត្រូវ' });
    }
    if (!mongoose.Types.ObjectId.isValid(pumpId)) {
      return res.status(400).json({ message: 'លេខសម្គាល់ស្តុកសាំងមិនត្រឹមត្រូវ' });
    }

    // Get fuel type
    const fuelType = await FuelType.findById(fuelTypeId);
    if (!fuelType) {
      return res.status(404).json({ message: 'មិនឃើញប្រភេទសាំង' });
    }

    // Get pump
    const pump = await Pump.findById(pumpId);
    if (!pump) {
      return res.status(404).json({ message: 'មិនឃើញស្តុកសាំង' });
    }

    // Calculate total cost - ensure proper number conversion
    const litersValue = parseFloat(liters);
    const price = pricePerLiter ? parseFloat(pricePerLiter) : 0;
    
    // Validate parsed numbers
    if (isNaN(litersValue) || litersValue <= 0) {
      return res.status(400).json({ message: 'សូមបញ្ចូលបរិមាណលីត្រដែលត្រឹមត្រូវ' });
    }
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ message: 'សូមបញ្ចូលតម្លៃទិញដែលត្រឹមត្រូវ' });
    }
    
    const totalCost = litersValue * price;

    // Use provided date or current date
    const stockDate = date ? new Date(date) : new Date();

    const stockEntry = new StockEntry({
      fuelTypeId,
      pumpId,
      liters: litersValue,
      pricePerLiter: price,
      totalCost: totalCost || 0,
      date: stockDate,
      notes
    });

    // Validate the document before saving
    const validationError = stockEntry.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      const errors = {};
      Object.keys(validationError.errors || {}).forEach(key => {
        errors[key] = validationError.errors[key].message;
      });
      return res.status(400).json({ 
        message: 'កំហុសក្នុងការផ្ទៀងផ្ទាត់ទិន្នន័យ',
        errors: errors,
        validationError: validationError.message
      });
    }

    await stockEntry.save();

    // Update pump stock (increase by liters added) - round to 2 decimal places to avoid floating point errors
    pump.stockLiters = Math.round(((pump.stockLiters || 0) + litersValue) * 100) / 100;
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
    const { fuelTypeId, pumpId, liters, pricePerLiter, date, notes } = req.body;
    
    // Validate stock entry ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'លេខសម្គាល់ព័ត៌មានស្តុកមិនត្រឹមត្រូវ' });
    }
    
    const stockEntry = await StockEntry.findById(req.params.id);
    if (!stockEntry) {
      return res.status(404).json({ message: 'មិនឃើញព័ត៌មានស្តុក' });
    }

    // Validate ObjectId format if provided
    const finalFuelTypeId = fuelTypeId || stockEntry.fuelTypeId;
    if (!mongoose.Types.ObjectId.isValid(finalFuelTypeId)) {
      return res.status(400).json({ message: 'លេខសម្គាល់ប្រភេទសាំងមិនត្រឹមត្រូវ' });
    }
    
    const finalPumpId = pumpId || stockEntry.pumpId;
    if (pumpId && !mongoose.Types.ObjectId.isValid(finalPumpId)) {
      return res.status(400).json({ message: 'លេខសម្គាល់ស្តុកសាំងមិនត្រឹមត្រូវ' });
    }

    // Get fuel type
    const fuelType = await FuelType.findById(finalFuelTypeId);
    if (!fuelType) {
      return res.status(404).json({ message: 'មិនឃើញប្រភេទសាំង' });
    }

    // Use provided liters or keep existing - ensure proper number conversion
    let newLiters;
    if (liters !== undefined) {
      newLiters = parseFloat(liters);
      if (isNaN(newLiters) || newLiters <= 0) {
        return res.status(400).json({ message: 'សូមបញ្ចូលបរិមាណលីត្រដែលត្រឹមត្រូវ' });
      }
    } else {
      newLiters = stockEntry.liters;
    }

    // Calculate total cost - ensure proper number conversion
    let newPricePerLiter;
    if (pricePerLiter !== undefined) {
      newPricePerLiter = parseFloat(pricePerLiter);
      if (isNaN(newPricePerLiter) || newPricePerLiter < 0) {
        return res.status(400).json({ message: 'សូមបញ្ចូលតម្លៃទិញដែលត្រឹមត្រូវ' });
      }
    } else {
      newPricePerLiter = stockEntry.pricePerLiter;
    }
    
    const newTotalCost = newLiters * newPricePerLiter;
    
    // Ensure totalCost is a valid number
    if (isNaN(newTotalCost)) {
      return res.status(400).json({ message: 'កំហុសក្នុងការគណនាតម្លៃសរុប' });
    }

    // Get old pump and new pump
    const oldPumpId = stockEntry.pumpId.toString();
    const oldPump = await Pump.findById(oldPumpId);
    const newPump = await Pump.findById(finalPumpId);

    if (!oldPump || !newPump) {
      return res.status(404).json({ message: 'មិនឃើញស្តុកសាំង' });
    }

    // Adjust stock: remove old liters from old pump, add new liters to new pump
    if (oldPumpId !== finalPumpId.toString()) {
      // Pump changed - round to 2 decimal places
      oldPump.stockLiters = Math.max(0, Math.round(((oldPump.stockLiters || 0) - stockEntry.liters) * 100) / 100);
      newPump.stockLiters = Math.round(((newPump.stockLiters || 0) + newLiters) * 100) / 100;
      await oldPump.save();
      await newPump.save();
    } else {
      // Same pump - adjust by difference - round to 2 decimal places
      const stockDifference = newLiters - stockEntry.liters;
      oldPump.stockLiters = Math.max(0, Math.round(((oldPump.stockLiters || 0) + stockDifference) * 100) / 100);
      await oldPump.save();
    }

    // Update stock entry
    stockEntry.fuelTypeId = finalFuelTypeId;
    stockEntry.pumpId = finalPumpId;
    stockEntry.liters = newLiters;
    stockEntry.pricePerLiter = newPricePerLiter;
    stockEntry.totalCost = newTotalCost;
    if (date) {
      stockEntry.date = new Date(date);
    }
    if (notes !== undefined) {
      stockEntry.notes = notes;
    }

    // Validate before saving
    const validationError = stockEntry.validateSync();
    if (validationError) {
      console.error('Validation error on update:', validationError);
      const errors = {};
      Object.keys(validationError.errors || {}).forEach(key => {
        errors[key] = validationError.errors[key].message;
      });
      return res.status(400).json({ 
        message: 'កំហុសក្នុងការផ្ទៀងផ្ទាត់ទិន្នន័យ',
        errors: errors,
        validationError: validationError.message
      });
    }

    await stockEntry.save();
    const populatedStockEntry = await StockEntry.findById(stockEntry._id)
      .populate('fuelTypeId')
      .populate('pumpId');

    res.json(populatedStockEntry);
  } catch (error) {
    console.error('Error updating stock entry:', error);
    // If it's a validation error, provide more details
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors || {}).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ 
        message: 'កំហុសក្នុងការផ្ទៀងផ្ទាត់ទិន្នន័យ',
        errors: errors,
        validationError: error.message
      });
    }
    res.status(400).json({ message: error.message });
  }
};

const deleteStockEntry = async (req, res) => {
  try {
    const stockEntry = await StockEntry.findById(req.params.id);
    if (!stockEntry) {
      return res.status(404).json({ message: 'មិនឃើញព័ត៌មានស្តុក' });
    }

    // Return stock to pump (decrease by liters) - round to 2 decimal places
    const pump = await Pump.findById(stockEntry.pumpId);
    if (pump) {
      pump.stockLiters = Math.max(0, Math.round(((pump.stockLiters || 0) - stockEntry.liters) * 100) / 100);
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

