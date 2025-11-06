#!/bin/bash

# API Speed Test Script
# Tests all main API endpoints and measures response times

BASE_URL="http://localhost:5001/api"
PORT=5001

echo "=========================================="
echo "API Speed Test & Analysis"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo ""

# Function to test endpoint and measure time
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    
    echo "Testing: $name"
    echo "URL: $url"
    
    # Measure time using curl with time command
    if [ "$method" = "GET" ]; then
        response_time=$(curl -o /dev/null -s -w "%{time_total}" -X GET "$url" 2>&1)
    else
        response_time=$(curl -o /dev/null -s -w "%{time_total}" -X "$method" "$url" 2>&1)
    fi
    
    # Convert to milliseconds
    time_ms=$(echo "$response_time * 1000" | bc)
    
    # Get response size
    size=$(curl -s -X GET "$url" 2>/dev/null | wc -c)
    
    # Get HTTP status
    status=$(curl -o /dev/null -s -w "%{http_code}" -X GET "$url" 2>/dev/null)
    
    echo "  Status: $status"
    echo "  Response Time: ${time_ms}ms"
    echo "  Response Size: ${size} bytes"
    echo ""
    
    # Store results
    echo "$name|$url|$status|${time_ms}ms|${size}bytes" >> /tmp/api-speed-results.txt
}

# Check if server is running
echo "Checking if server is running on port $PORT..."
if ! curl -s "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
    echo "❌ Server is not running on port $PORT"
    echo "Please start the server first: cd server && npm start"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Clear previous results
rm -f /tmp/api-speed-results.txt

# Test Health Endpoint
echo "1. Health Check"
test_endpoint "Health Check" "$BASE_URL/health"

# Test Fuel Types
echo "2. Fuel Types"
test_endpoint "Get All Fuel Types" "$BASE_URL/fuel-types"

# Test Pumps
echo "3. Pumps"
test_endpoint "Get All Pumps" "$BASE_URL/pumps"

# Test Stock Entries (requires auth, but let's test anyway)
echo "4. Stock Entries"
test_endpoint "Get All Stock Entries" "$BASE_URL/stock-entries"

# Test Transactions (with pagination)
echo "5. Transactions"
test_endpoint "Get Transactions (Page 1, 50 items)" "$BASE_URL/transactions?page=1&limit=50"

# Test Transactions with date filter (today)
TODAY=$(date +%Y-%m-%d)
echo "6. Transactions with Date Filter"
test_endpoint "Get Transactions (Today)" "$BASE_URL/transactions?page=1&limit=50&startDate=$TODAY&endDate=$TODAY"

# Test Dashboard
echo "7. Dashboard"
test_endpoint "Get Dashboard Stats (Daily)" "$BASE_URL/dashboard?period=daily"

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "Results saved to: /tmp/api-speed-results.txt"
echo ""
echo "Detailed Results:"
cat /tmp/api-speed-results.txt | column -t -s '|' -N "Endpoint,URL,Status,Time,Size"
echo ""

# Calculate averages
echo "Performance Analysis:"
echo "-------------------"
total_time=$(cat /tmp/api-speed-results.txt | cut -d'|' -f4 | sed 's/ms//' | awk '{sum+=$1} END {print sum}')
count=$(wc -l < /tmp/api-speed-results.txt | tr -d ' ')
avg_time=$(echo "scale=2; $total_time / $count" | bc)
echo "Average Response Time: ${avg_time}ms"
echo ""

# Find slowest endpoint
slowest=$(cat /tmp/api-speed-results.txt | sort -t'|' -k4 -rn | head -1)
slowest_name=$(echo $slowest | cut -d'|' -f1)
slowest_time=$(echo $slowest | cut -d'|' -f4)
echo "Slowest Endpoint: $slowest_name ($slowest_time)"
echo ""

# Find fastest endpoint
fastest=$(cat /tmp/api-speed-results.txt | sort -t'|' -k4 -n | head -1)
fastest_name=$(echo $fastest | cut -d'|' -f1)
fastest_time=$(echo $fastest | cut -d'|' -f4)
echo "Fastest Endpoint: $fastest_name ($fastest_time)"
echo ""

# Performance recommendations
echo "Performance Recommendations:"
echo "----------------------------"
if (( $(echo "$avg_time > 500" | bc -l) )); then
    echo "⚠️  Average response time is high (>500ms). Consider:"
    echo "   - Adding database indexes"
    echo "   - Implementing caching"
    echo "   - Optimizing database queries"
fi

slow_endpoints=$(cat /tmp/api-speed-results.txt | awk -F'|' '$4+0 > 1000 {print $1 " (" $4 ")"}')
if [ ! -z "$slow_endpoints" ]; then
    echo "⚠️  Slow endpoints (>1000ms):"
    echo "$slow_endpoints" | sed 's/^/   - /'
fi

echo ""
echo "Test completed!"

