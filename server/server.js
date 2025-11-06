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
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
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
      // In development, allow all localhost origins
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // Allow all in development for testing
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS to all routes
app.use(cors(corsOptions));

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
  
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔄 Auto-reload ping starting...`);
  
  https.get(healthUrl, (res) => {
    console.log(`[${new Date().toISOString()}] ✅ Auto-reload ping successful - Status: ${res.statusCode}`);
  }).on("error", (err) => {
    console.log(`[${new Date().toISOString()}] ❌ Auto-reload ping failed: ${err.message}`);
  }).on("timeout", () => {
    console.log(`[${new Date().toISOString()}] ⏰ Auto-reload ping timed out`);
  }).setTimeout(10000);
};

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start auto-reload pings (running in all environments for testing)
  console.log('🚀 Starting auto-reload pings every 10 minutes...');
  
  // Send first ping after 1 minute to ensure server is ready
  setTimeout(() => {
    console.log('🚀 Auto-reload started! First ping in 1 minute...');
    autoReload();
    // Then set up regular interval
    setInterval(autoReload, 10 * 60 * 1000); // 10 minutes
  }, 60000); // 1 minute delay
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
