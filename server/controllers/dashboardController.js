const Transaction = require('../models/Transaction');
const StockEntry = require('../models/StockEntry');

// Helper function to calculate average cost price from stock entries
const calculateAverageCostPrice = async (pumpId, transactionDate = null) => {
  const query = { pumpId };
  if (transactionDate) {
    query.date = { $lte: transactionDate };
  }
  
  const stockEntries = await StockEntry.find(query).sort({ date: 1 });
  
  if (stockEntries.length === 0) {
    return 0;
  }

  let totalLiters = 0;
  let totalCost = 0;
  
  stockEntries.forEach(entry => {
    totalLiters += entry.liters || 0;
    totalCost += entry.totalCost || 0;
  });

  return totalLiters > 0 ? totalCost / totalLiters : 0;
};

// Helper function to get date range for a period
const getDateRange = (period, customFrom, customTo) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let startDate;
  let endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);
  
  switch (period) {
    case 'daily':
      startDate = new Date(today);
      break;
    case 'weekly':
      // Current week: Monday to Sunday
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(today);
      startDate.setDate(today.getDate() - daysToMonday);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'custom':
      if (customFrom && customTo) {
        startDate = new Date(customFrom);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customTo);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(today);
      }
      break;
    default:
      startDate = new Date(today);
  }
  
  return { startDate, endDate };
};

const getDashboardStats = async (req, res) => {
  try {
    const period = req.query.period || 'daily';
    const customFrom = req.query.customFrom;
    const customTo = req.query.customTo;
    
    const { startDate, endDate } = getDateRange(period, customFrom, customTo);

    // Get transactions for the selected period
    const periodTransactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('pumpId').populate('fuelTypeId').sort({ date: -1 });

    // Calculate period stats - ensure all values are numbers
    const periodTotal = periodTransactions.reduce((sum, t) => {
      const total = Number(t.total) || 0;
      return sum + total;
    }, 0);
    
    // Calculate profit - always recalculate from actual values for accuracy
    let periodProfit = 0;
    for (const t of periodTransactions) {
      const priceOut = Number(t.priceOut || t.price || 0);
      let priceIn = Number(t.priceIn || 0);
      const liters = Number(t.liters || 0);
      const discount = Number(t.discount || 0);
      
      // Always calculate priceIn from stock entries for accuracy
      if (priceOut > 0 && liters > 0) {
        const pumpId = typeof t.pumpId === 'object' ? t.pumpId._id : t.pumpId;
        const calculatedPriceIn = await calculateAverageCostPrice(pumpId, t.date);
        // Use calculated priceIn if we got a value, otherwise use stored priceIn
        if (calculatedPriceIn > 0) {
          priceIn = calculatedPriceIn;
        }
      }
      
      // Always recalculate profit for accuracy: (priceOut - priceIn) * liters - discount
      const profit = (priceOut - priceIn) * liters - discount;
      periodProfit += profit;
    }
    
    const periodLiters = periodTransactions.reduce((sum, t) => {
      const liters = Number(t.liters) || 0;
      return sum + liters;
    }, 0);
    
    const periodTransactionsCount = periodTransactions.length;

    // All-time stats (for comparison)
    const allTransactions = await Transaction.find().populate('pumpId').populate('fuelTypeId');
    
    const allTimeTotal = allTransactions.reduce((sum, t) => {
      const total = Number(t.total) || 0;
      return sum + total;
    }, 0);
    
    // Calculate all-time profit - always recalculate from actual values for accuracy
    let allTimeProfit = 0;
    for (const t of allTransactions) {
      const priceOut = Number(t.priceOut || t.price || 0);
      let priceIn = Number(t.priceIn || 0);
      const liters = Number(t.liters || 0);
      const discount = Number(t.discount || 0);
      
      // Always calculate priceIn from stock entries for accuracy
      if (priceOut > 0 && liters > 0) {
        const pumpId = typeof t.pumpId === 'object' ? t.pumpId._id : t.pumpId;
        const calculatedPriceIn = await calculateAverageCostPrice(pumpId, t.date);
        // Use calculated priceIn if we got a value, otherwise use stored priceIn
        if (calculatedPriceIn > 0) {
          priceIn = calculatedPriceIn;
        }
      }
      
      // Always recalculate profit for accuracy: (priceOut - priceIn) * liters - discount
      const profit = (priceOut - priceIn) * liters - discount;
      allTimeProfit += profit;
    }
    
    const totalLiters = allTransactions.reduce((sum, t) => {
      const liters = Number(t.liters) || 0;
      return sum + liters;
    }, 0);

    res.json({
      period: {
        total: Number(periodTotal.toFixed(2)),
        profit: Number(periodProfit.toFixed(2)),
        transactions: periodTransactionsCount,
        liters: Number(periodLiters.toFixed(2))
      },
      allTime: {
        total: Number(allTimeTotal.toFixed(2)),
        profit: Number(allTimeProfit.toFixed(2)),
        transactions: allTransactions.length,
        liters: Number(totalLiters.toFixed(2))
      },
      recentTransactions: periodTransactions.slice(0, 10),
      periodType: period || 'daily',
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    // Return empty structure instead of error to prevent frontend crashes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    res.json({
      period: {
        total: 0,
        profit: 0,
        transactions: 0,
        liters: 0
      },
      allTime: {
        total: 0,
        profit: 0,
        transactions: 0,
        liters: 0
      },
      recentTransactions: [],
      periodType: req.query.period || 'daily',
      dateRange: {
        from: today.toISOString(),
        to: tomorrow.toISOString()
      }
    });
  }
};

module.exports = {
  getDashboardStats
};

