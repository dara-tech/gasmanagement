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

    // Use MongoDB aggregation for fast calculations - runs in database
    const periodStats = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          profit: { $sum: '$profit' },
          liters: { $sum: '$liters' },
          transactions: { $sum: 1 }
        }
      }
    ]);

    // Get all-time stats using aggregation (much faster than loading all documents)
    const allTimeStats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          profit: { $sum: '$profit' },
          liters: { $sum: '$liters' },
          transactions: { $sum: 1 }
        }
      }
    ]);

    // Get recent transactions for display (limit to 10)
    const periodTransactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('pumpId')
      .populate('fuelTypeId')
      .sort({ date: -1 })
      .limit(10)
      .lean(); // Use lean() for faster queries when we don't need Mongoose documents

    // Extract stats from aggregation results
    const periodData = periodStats[0] || { total: 0, profit: 0, liters: 0, transactions: 0 };
    const allTimeData = allTimeStats[0] || { total: 0, profit: 0, liters: 0, transactions: 0 };

    res.json({
      period: {
        total: Number(periodData.total.toFixed(2)),
        profit: Number(periodData.profit.toFixed(2)),
        transactions: periodData.transactions,
        liters: Number(periodData.liters.toFixed(2))
      },
      allTime: {
        total: Number(allTimeData.total.toFixed(2)),
        profit: Number(allTimeData.profit.toFixed(2)),
        transactions: allTimeData.transactions,
        liters: Number(allTimeData.liters.toFixed(2))
      },
      recentTransactions: periodTransactions,
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

