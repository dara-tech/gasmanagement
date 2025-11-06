const Transaction = require('../models/Transaction');
const FuelType = require('../models/FuelType');
const FuelPriceHistory = require('../models/FuelPriceHistory');
const Pump = require('../models/Pump');
const StockEntry = require('../models/StockEntry');

const getAllTransactions = async (req, res) => {
  try {
    // Check if pagination is requested
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build query for filters
    const query = {};
    
    // Date range filters
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        query.date.$lte = endDate;
      }
    }

    // Pump filter
    if (req.query.pumpId) {
      query.pumpId = req.query.pumpId;
    }

    // Get transactions
    let transactions;
    if (hasPagination) {
      // Paginated response
      const total = await Transaction.countDocuments(query);
      transactions = await Transaction.find(query)
        .populate('pumpId')
        .populate('fuelTypeId')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      });
    } else {
      // Backward compatibility: return array directly
      transactions = await Transaction.find(query)
        .populate('pumpId')
        .populate('fuelTypeId')
        .sort({ date: -1 });
      
      res.json(transactions);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('pumpId')
      .populate('fuelTypeId');
    if (!transaction) {
      return res.status(404).json({ message: 'មិនឃើញព័ត៌មាន' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate average cost price from stock entries
const calculateAverageCostPrice = async (pumpId, transactionDate = null) => {
  // If transactionDate is provided, only use stock entries before or at that date
  const query = { pumpId };
  if (transactionDate) {
    query.date = { $lte: transactionDate };
  }
  
  const stockEntries = await StockEntry.find(query)
    .sort({ date: 1 }); // Oldest first (FIFO)
  
  if (stockEntries.length === 0) {
    return 0;
  }

  // Calculate weighted average cost
  let totalLiters = 0;
  let totalCost = 0;
  
  stockEntries.forEach(entry => {
    totalLiters += entry.liters;
    totalCost += entry.totalCost;
  });

  return totalLiters > 0 ? totalCost / totalLiters : 0;
};

const createTransaction = async (req, res) => {
  try {
    const { pumpId, fuelTypeId, liters, date, discount = 0, discountType = 'amount' } = req.body;
    
    // Check pump and stock
    const pump = await Pump.findById(pumpId);
    if (!pump) {
      return res.status(404).json({ message: 'មិនឃើញស្តុកសាំង' });
    }

    // Validate stock availability
    const availableStock = pump.stockLiters || 0;
    if (liters > availableStock) {
      return res.status(400).json({ 
        message: `ស្តុកមិនគ្រប់គ្រាន់។ ស្តុកមាន: ${availableStock.toFixed(2)} លីត្រ, ត្រូវការ: ${liters.toFixed(2)} លីត្រ` 
      });
    }
    
    const fuelType = await FuelType.findById(fuelTypeId);
    if (!fuelType) {
      return res.status(404).json({ message: 'មិនឃើញប្រភេទសាំង' });
    }

    // Use provided date or current date
    const transactionDate = date ? new Date(date) : new Date();
    const priceDate = new Date(transactionDate);
    priceDate.setHours(0, 0, 0, 0);
    const endOfPriceDate = new Date(priceDate);
    endOfPriceDate.setHours(23, 59, 59, 999);

    // Get price for the transaction date (latest price on or before that date)
    let priceOut = fuelType.price; // Default price
    const priceHistory = await FuelPriceHistory.findOne({
      fuelTypeId,
      date: { $lte: endOfPriceDate }
    }).sort({ date: -1 });
    
    if (priceHistory) {
      priceOut = priceHistory.price;
    }
    const priceIn = await calculateAverageCostPrice(pumpId, transactionDate); // Cost price from stock entries
    const discountValue = parseFloat(discount) || 0;
    const totalBeforeDiscount = liters * priceOut;
    
    // Calculate discount amount based on type
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (totalBeforeDiscount * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
    
    const total = Math.max(0, totalBeforeDiscount - discountAmount);
    const profit = (priceOut - priceIn) * liters - discountAmount;

    const transaction = new Transaction({
      pumpId,
      fuelTypeId,
      liters,
      price: priceOut, // Keep for backward compatibility
      priceIn,
      priceOut,
      discount: discountAmount,
      discountType: discountType || 'amount',
      profit,
      total,
      date: transactionDate
    });

    await transaction.save();
    
    // Update pump stock (decrease by liters sold) - round to 2 decimal places
    pump.stockLiters = Math.max(0, Math.round(((pump.stockLiters || 0) - liters) * 100) / 100);
    await pump.save();

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('pumpId')
      .populate('fuelTypeId');

    res.status(201).json(populatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { pumpId, fuelTypeId, liters, date, discount, discountType } = req.body;
    
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'មិនឃើញព័ត៌មាន' });
    }

    // Get the pump
    const targetPumpId = pumpId || transaction.pumpId;
    const pump = await Pump.findById(targetPumpId);
    if (!pump) {
      return res.status(404).json({ message: 'មិនឃើញស្តុកសាំង' });
    }

    // Calculate stock difference
    const oldLiters = transaction.liters;
    const newLiters = liters;
    const oldPumpId = transaction.pumpId.toString();
    const newPumpId = targetPumpId.toString();

    // If pump changed, return stock to old pump and check new pump
    if (oldPumpId !== newPumpId) {
      const oldPump = await Pump.findById(oldPumpId);
      if (oldPump) {
        // Round to 2 decimal places
        oldPump.stockLiters = Math.round(((oldPump.stockLiters || 0) + oldLiters) * 100) / 100;
        await oldPump.save();
      }
      
      // Check new pump stock
      const availableStock = pump.stockLiters || 0;
      if (newLiters > availableStock) {
        return res.status(400).json({ 
          message: `ស្តុកមិនគ្រប់គ្រាន់។ ស្តុកមាន: ${availableStock.toFixed(2)} លីត្រ, ត្រូវការ: ${newLiters.toFixed(2)} លីត្រ` 
        });
      }
      
      // Deduct from new pump - round to 2 decimal places
      pump.stockLiters = Math.max(0, Math.round((availableStock - newLiters) * 100) / 100);
    } else {
      // Same pump - calculate net change
      const stockDifference = oldLiters - newLiters;
      const currentStock = pump.stockLiters || 0;
      
      if (stockDifference < 0) {
        // Increasing liters - need more stock
        const neededStock = Math.abs(stockDifference);
        if (neededStock > currentStock) {
          return res.status(400).json({ 
            message: `ស្តុកមិនគ្រប់គ្រាន់។ ស្តុកមាន: ${currentStock.toFixed(2)} លីត្រ, ត្រូវការ: ${neededStock.toFixed(2)} លីត្រ` 
          });
        }
      }
      
      // Update stock - round to 2 decimal places
      pump.stockLiters = Math.max(0, Math.round((currentStock + stockDifference) * 100) / 100);
    }
    
    await pump.save();

    // Get fuel type and calculate prices
    let fuelType = await FuelType.findById(fuelTypeId || transaction.fuelTypeId);
    if (!fuelType) {
      return res.status(404).json({ message: 'មិនឃើញប្រភេទសាំង' });
    }

    // Update date if provided
    const transactionDate = date ? new Date(date) : transaction.date;
    const priceDate = new Date(transactionDate);
    priceDate.setHours(0, 0, 0, 0);
    const endOfPriceDate = new Date(priceDate);
    endOfPriceDate.setHours(23, 59, 59, 999);

    // Get price for the transaction date (latest price on or before that date)
    let priceOut = fuelType.price; // Default price
    const priceHistory = await FuelPriceHistory.findOne({
      fuelTypeId: fuelType._id,
      date: { $lte: endOfPriceDate }
    }).sort({ date: -1 });
    
    if (priceHistory) {
      priceOut = priceHistory.price;
    }
    const priceIn = await calculateAverageCostPrice(targetPumpId, transactionDate);
    const totalBeforeDiscount = newLiters * priceOut;
    
    // Calculate discount amount based on type
    let discountAmount = 0;
    const discountValue = discount !== undefined ? parseFloat(discount) : (transaction.discount || 0);
    const finalDiscountType = discountType || transaction.discountType || 'amount';
    
    if (finalDiscountType === 'percentage') {
      discountAmount = (totalBeforeDiscount * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
    
    const total = Math.max(0, totalBeforeDiscount - discountAmount);
    const profit = (priceOut - priceIn) * newLiters - discountAmount;

    transaction.pumpId = pumpId || transaction.pumpId;
    transaction.fuelTypeId = fuelTypeId || transaction.fuelTypeId;
    transaction.liters = newLiters;
    transaction.price = priceOut; // Keep for backward compatibility
    transaction.priceIn = priceIn;
    transaction.priceOut = priceOut;
    transaction.discount = discountAmount;
    transaction.discountType = finalDiscountType;
    transaction.profit = profit;
    transaction.total = total;
    transaction.date = transactionDate;

    await transaction.save();
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('pumpId')
      .populate('fuelTypeId');

    res.json(populatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'មិនឃើញព័ត៌មាន' });
    }

    // Return stock to pump - round to 2 decimal places
    const pump = await Pump.findById(transaction.pumpId);
    if (pump) {
      pump.stockLiters = Math.round(((pump.stockLiters || 0) + transaction.liters) * 100) / 100;
      await pump.save();
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'លុបព័ត៌មានដោយជោគជ័យ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
};

