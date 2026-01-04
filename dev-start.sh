#!/bin/bash

# Development startup script for Verba Frontend
# This script starts both frontend and backend in development mode

echo "🚀 Starting Verba Development Environment..."
echo ""

# Check if backend directory exists
BACKEND_DIR="../testing-mvp-sesame/testing-mvp-sesame"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found at: $BACKEND_DIR"
    echo "Please update the BACKEND_DIR variable in this script."
    exit 1
fi

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Backend
echo "📡 Starting Backend (FastAPI)..."
cd "$BACKEND_DIR"
python server.py &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo "   Backend URL: http://localhost:8000"
echo ""

# Wait for backend to start
echo "⏳ Waiting for backend to initialize (10 seconds)..."
sleep 10

# Return to frontend directory
cd - > /dev/null

# Start Frontend
echo "🎨 Starting Frontend (Vite)..."
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
echo "   Frontend URL: http://localhost:5173"
echo ""

echo "✅ Both services are running!"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait
