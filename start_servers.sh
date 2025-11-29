#!/bin/bash

echo "🚀 Starting HealthSphere AI servers..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt

# Start backend server in background
echo "🔧 Starting FastAPI backend server..."
uvicorn app:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Install frontend dependencies and start
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "🎨 Starting React frontend server..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Servers started!"
echo "🔗 Backend: http://127.0.0.1:8000"
echo "🔗 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID