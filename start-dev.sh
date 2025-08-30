#!/bin/bash

# Start development servers for Virtual Options Desk
echo "🚀 Starting Virtual Options Desk Development Environment"
echo "=================================================="

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && ~/.bun/bin/bun install && cd ..
fi

# Check if CrewAI dependencies are installed
if [ ! -d "crewai-service/python" ]; then
    echo "❌ CrewAI service not found. Please set up crewai-service directory with Python analysis scripts."
else
    echo "🐍 Checking Python dependencies..."
    cd crewai-service
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt 2>/dev/null || echo "⚠️  Python dependencies may need installation"
    fi
    cd ..
fi

echo ""
echo "🌐 Starting services:"
echo "  Frontend:  http://localhost:3000"
echo "  CrewAI:    http://localhost:8001 (if available)"
echo ""
echo "📝 To test APIs:"
echo "  Blog Agent: ~/.bun/bin/bun run test:blog"
echo "  Market Data: curl http://localhost:3000/api/market-data"
echo ""
echo "⚠️  Remember to set up API keys in frontend/.env.local"
echo ""

# Start both services in parallel
export PATH="/home/codespace/.bun/bin:$PATH"

# Start frontend
echo "🎨 Starting Next.js frontend..."
cd frontend && bun run dev &
FRONTEND_PID=$!

# Wait a bit for frontend to start
sleep 3

# Start CrewAI service if available
if [ -f "crewai-service/main.py" ]; then
    echo "🤖 Starting CrewAI service..."
    cd crewai-service && python3 main.py &
    CREWAI_PID=$!
    cd ..
else
    echo "⚠️  CrewAI service not available (will use fallback analysis)"
fi

# Handle shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $FRONTEND_PID 2>/dev/null
    if [ ! -z "$CREWAI_PID" ]; then
        kill $CREWAI_PID 2>/dev/null
    fi
    echo "✅ Services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "✅ Development environment ready!"
echo "Press Ctrl+C to stop all services"

# Wait for services
wait