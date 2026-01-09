#!/bin/bash

# ==========================================
# Verba - Master Startup Script
# Starts both Backend and Frontend
# ==========================================

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Verba - Starting All Services on RunPod"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ==========================================
# CONFIGURATION
# ==========================================
# Detectar si estamos en RunPod o local
if [ -d "/workspace/testing-mvp-sesame" ]; then
    # RunPod
    BACKEND_DIR="/workspace/testing-mvp-sesame"
    FRONTEND_DIR="/workspace/UI-verba-mvp"
else
    # Local
    BACKEND_DIR="../testing-mvp-sesame/testing-mvp-sesame"
    FRONTEND_DIR="."
fi

# ==========================================
# CLEANUP FUNCTION
# ==========================================
cleanup() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🛑 Stopping all services..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ ! -z "$BACKEND_PID" ]; then
        echo "   Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        echo "   Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    echo "✅ All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ==========================================
# 1. SETUP BACKEND
# ==========================================
echo "📡 Setting up Backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ ERROR: Backend directory not found at $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"

# Check if startup.sh exists, if not create it
if [ ! -f "startup.sh" ]; then
    echo "⚠️  startup.sh not found in backend, creating it..."
    cat > startup.sh << 'BACKEND_STARTUP'
#!/bin/bash
set -e
echo "🚀 Setting up Backend..."
echo "📦 Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq portaudio19-dev ffmpeg curl git > /dev/null 2>&1
echo "✅ System dependencies installed"

echo "🐍 Installing Python dependencies..."
pip install -q -r requirements.txt
echo "✅ Python dependencies installed"

if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env template..."
    cat > .env << 'EOF'
GROQ_API_KEY=your_groq_api_key_here
WHISPER_MODEL=base
TTS_VOICE=en-US-Neural2-C
HOST=0.0.0.0
PORT=8000
EOF
    echo "❌ IMPORTANT: Set your GROQ_API_KEY in .env"
    exit 1
fi

if grep -q "your_groq_api_key_here" .env; then
    echo "❌ ERROR: GROQ_API_KEY not configured"
    exit 1
fi

echo "✅ Backend setup complete"
BACKEND_STARTUP
    chmod +x startup.sh
fi

# Run backend startup script
chmod +x startup.sh
./startup.sh

echo ""
echo "✅ Backend setup complete"
echo ""

# ==========================================
# 2. SETUP FRONTEND
# ==========================================
echo "🎨 Setting up Frontend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$FRONTEND_DIR"

# Check if startup.sh exists, if not create it
if [ ! -f "startup.sh" ]; then
    echo "⚠️  startup.sh not found in frontend, creating it..."
    cat > startup.sh << 'FRONTEND_STARTUP'
#!/bin/bash
set -e
echo "🚀 Setting up Frontend..."

if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js installed"
else
    echo "✅ Node.js already installed ($(node --version))"
fi

echo "📦 Installing npm dependencies..."
npm install
echo "✅ npm dependencies installed"

if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
EOF
    echo "✅ .env created with localhost URLs"
fi

echo "✅ Frontend setup complete"
FRONTEND_STARTUP
    chmod +x startup.sh
fi

# Run frontend startup script
chmod +x startup.sh
./startup.sh

echo ""
echo "✅ Frontend setup complete"
echo ""

# ==========================================
# 3. START SERVICES
# ==========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting Services..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start Backend
echo "📡 Starting Backend..."
cd "$BACKEND_DIR"
python server.py > /tmp/verba-backend.log 2>&1 &
BACKEND_PID=$!
echo "   ✅ Backend started (PID: $BACKEND_PID)"
echo "   📋 Logs: /tmp/verba-backend.log"
echo "   🌐 URL: http://0.0.0.0:8000"

# Wait for backend to be ready
echo ""
echo "⏳ Waiting for backend to initialize (15 seconds)..."
sleep 15

# Check if backend is running
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ ERROR: Backend failed to start. Check logs:"
    echo "   tail -f /tmp/verba-backend.log"
    exit 1
fi

# Test backend
if curl -s -f http://localhost:8000 > /dev/null 2>&1; then
    echo "✅ Backend is responding"
else
    echo "⚠️  WARNING: Backend may not be ready yet"
fi

echo ""

# Start Frontend
echo "🎨 Starting Frontend..."
cd "$FRONTEND_DIR"
npm run dev > /tmp/verba-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   ✅ Frontend started (PID: $FRONTEND_PID)"
echo "   📋 Logs: /tmp/verba-frontend.log"
echo "   🌐 URL: http://0.0.0.0:5173"

# ==========================================
# 4. DISPLAY INFO
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ All Services Running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Service Status:"
echo "   • Backend:  PID $BACKEND_PID - http://0.0.0.0:8000"
echo "   • Frontend: PID $FRONTEND_PID - http://0.0.0.0:5173"
echo ""
echo "📋 Logs:"
echo "   • Backend:  tail -f /tmp/verba-backend.log"
echo "   • Frontend: tail -f /tmp/verba-frontend.log"
echo ""
echo "🌐 Access (RunPod):"
echo "   • Expose ports 8000 and 5173 in RunPod UI"
echo "   • Frontend: https://xxxxx-5173.proxy.runpod.net"
echo "   • Backend:  https://xxxxx-8000.proxy.runpod.net"
echo ""
echo "💡 Commands:"
echo "   • Stop services: Press Ctrl+C"
echo "   • View logs: tail -f /tmp/verba-*.log"
echo "   • Test backend: curl http://localhost:8000"
echo ""
echo "⏳ Keeping services running... (Press Ctrl+C to stop)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ==========================================
# 5. MONITOR AND KEEP ALIVE
# ==========================================

# Follow logs in background
tail -f /tmp/verba-backend.log /tmp/verba-frontend.log &
TAIL_PID=$!

# Wait for processes
while true; do
    # Check if backend is still running
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo ""
        echo "❌ Backend stopped unexpectedly!"
        echo "   Check logs: tail -f /tmp/verba-backend.log"
        cleanup
    fi

    # Check if frontend is still running
    if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo ""
        echo "❌ Frontend stopped unexpectedly!"
        echo "   Check logs: tail -f /tmp/verba-frontend.log"
        cleanup
    fi

    sleep 5
done
