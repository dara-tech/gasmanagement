# Gas Station Management System - ការាស់សាំង

A modern gas station management system built with React, Express, and MongoDB. All UI in Khmer language.

## Tech Stack

- **Frontend**: React with TypeScript, shadcn UI, React Icons
- **Backend**: Express.js with Node.js
- **Database**: MongoDB with Mongoose
- **Language**: Khmer (Cambodian) UI

## Features

- 🔐 **Authentication**: Owner login system
- ⛽ **Fuel Types Management**: Add, edit, delete fuel types with pricing
- 🚗 **Pump Management**: Manage fuel pumps with status tracking
- 💰 **Transaction Recording**: Record sales transactions
- 📊 **Dashboard**: Real-time statistics and sales overview
- 🇰🇭 **Khmer Language**: Complete UI in Khmer language

## Project Structure

```
station/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/        # shadcn UI components
│   │   │   └── Layout.tsx
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── lib/           # Utilities
│   │   └── App.tsx
│   └── package.json
├── server/                 # Express backend
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── controllers/       # Route controllers
│   ├── config/            # DB config
│   └── server.js
└── package.json           # Root package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation

1. Clone the repository and install dependencies:

```bash
npm run install:all
```

Or install manually:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

2. Set up environment variables:

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gas-station
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

3. Start MongoDB (if running locally):

```bash
mongod
```

### Running the Application

From the root directory:

```bash
npm run dev
```

This will start both the server (port 5000) and client (port 3000).

Or run separately:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### First Time Setup

1. Start the backend server
2. Register a user account by making a POST request to `/api/auth/register`:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

Or use the registration endpoint from the frontend (if implemented).

3. Login with your credentials at `http://localhost:3000/login`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user

### Fuel Types
- `GET /api/fuel-types` - Get all fuel types
- `GET /api/fuel-types/:id` - Get fuel type by ID
- `POST /api/fuel-types` - Create fuel type (requires auth)
- `PUT /api/fuel-types/:id` - Update fuel type (requires auth)
- `DELETE /api/fuel-types/:id` - Delete fuel type (requires auth)

### Pumps
- `GET /api/pumps` - Get all pumps
- `GET /api/pumps/:id` - Get pump by ID
- `POST /api/pumps` - Create pump (requires auth)
- `PUT /api/pumps/:id` - Update pump (requires auth)
- `DELETE /api/pumps/:id` - Delete pump (requires auth)

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create transaction (requires auth)

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics (requires auth)

## Usage

1. **Login**: Use your registered credentials to access the system
2. **Add Fuel Types**: Go to "ប្រភេទសាំង" and add fuel types with prices
3. **Add Pumps**: Go to "ស្តុកសាំង" and add pumps, assign them to fuel types
4. **Record Sales**: Go to "ព័ត៌មានលក់" and record transactions
5. **View Dashboard**: See statistics and sales overview on the dashboard

## Development

- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:5000`
- API base URL: `http://localhost:5000/api`

## License

MIT
