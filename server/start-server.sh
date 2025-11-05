#!/bin/bash

# Kill any process on port 5000
echo "Clearing port 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null
sleep 2

# Check if MongoDB is running
if ! pgrep -f "mongod" > /dev/null; then
    echo "⚠️  Warning: MongoDB doesn't appear to be running"
    echo "Please start MongoDB first: mongod"
fi

# Start the server
echo "Starting server..."
npm run dev

