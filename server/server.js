require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Middleware - CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment or use defaults
    const envOrigins = process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : [];
    
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      'https://gasstation01.netlify.app',
      ...envOrigins
    ];
    
    // In production, allow specified origins or all if none specified
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.length > 3 || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in production if no specific origins set
      }
    } else {
      // In development, allow all
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Explicitly handle preflight requests - must be before other middleware
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    const envOrigins = process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : [];
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      'https://gasstation01.netlify.app',
      ...envOrigins
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400'); // 24 hours
      return res.sendStatus(204);
    }
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/fuel-types', require('./routes/fuelTypeRoutes'));
app.use('/api/fuel-prices', require('./routes/fuelPriceHistoryRoutes'));
app.use('/api/pumps', require('./routes/pumpRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/stock-entries', require('./routes/stockEntryRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Auto-reload function to prevent server sleep (Render free tier)
const autoReload = () => {
  const https = require('https');
  
  // Use the specific Render URL
  const serverUrl = process.env.SERVER_URL || 'https://gasmanagement.onrender.com';
  const healthUrl = `${serverUrl}/api/health`;
  
  https.get(healthUrl, (res) => {
    // Auto-reload ping successful (silent)
  }).on("error", (err) => {
    // Auto-reload ping failed (silent)
  }).on("timeout", () => {
    // Auto-reload ping timed out (silent)
  }).setTimeout(10000);
};

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start auto-reload pings (only in production)
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 Starting auto-reload pings every 14 minutes...');
    
    // Send first ping after 1 minute to ensure server is ready
    setTimeout(() => {
      autoReload();
      // Then set up regular interval
      setInterval(autoReload, 14 * 60 * 1000); // 14 minutes
    }, 60000); // 1 minute delay
  }
});

// Handle port already in use
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.log('Please run: lsof -ti:5000 | xargs kill -9');
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
