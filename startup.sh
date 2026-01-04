#!/bin/bash

# ==========================================
# Verba Frontend - RunPod Startup Script
# ==========================================

set -e  # Exit on error

echo "🚀 Starting Verba Frontend Setup on RunPod..."
echo ""

# ==========================================
# 1. INSTALL NODE.JS (if not installed)
# ==========================================
if ! command -v node &> /dev/null; then
    echo "📦 Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js installed"
else
    echo "✅ Node.js already installed ($(node --version))"
fi

if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm not found after Node.js installation"
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# ==========================================
# 2. INSTALL NPM DEPENDENCIES
# ==========================================
echo ""
echo "📦 Installing npm dependencies..."

if [ ! -d "node_modules" ]; then
    echo "   (First time installation, this may take a few minutes...)"
    npm install
else
    echo "   node_modules exists, checking for updates..."
    npm install
fi

echo "✅ npm dependencies installed"

# ==========================================
# 3. CHECK .ENV FILE
# ==========================================
echo ""
echo "⚙️  Checking configuration..."

if [ ! -f ".env" ]; then
    echo "⚠️  WARNING: .env file not found!"
    echo "   Creating .env template..."
    cat > .env << 'EOF'
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
EOF
    echo "✅ .env created with default values (localhost)"
    echo ""
    echo "💡 IMPORTANT for RunPod:"
    echo "   Update .env with your RunPod public URLs:"
    echo "   VITE_API_URL=https://xxxxx-8000.proxy.runpod.net"
    echo "   VITE_WS_URL=wss://xxxxx-8000.proxy.runpod.net"
    echo ""
fi

# Display current .env
echo "📋 Current configuration (.env):"
cat .env | sed 's/^/   /'
echo ""

# ==========================================
# 4. CHECK BACKEND CONNECTION
# ==========================================
echo "🔍 Checking backend connection..."

# Extract API URL from .env
API_URL=$(grep VITE_API_URL .env | cut -d '=' -f2)

if [ "$API_URL" == "http://localhost:8000" ]; then
    echo "⚠️  Using localhost backend. Make sure backend is running:"
    echo "   cd /workspace/testing-mvp-sesame"
    echo "   ./startup.sh --start"
    echo ""
elif curl -s -f -m 5 "$API_URL" > /dev/null 2>&1; then
    echo "✅ Backend is reachable at $API_URL"
else
    echo "⚠️  WARNING: Cannot reach backend at $API_URL"
    echo "   Make sure the backend is running and URLs in .env are correct"
    echo ""
fi

# ==========================================
# 5. DISPLAY INFO
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Setup Complete! Ready to start frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Configuration:"
echo "   • Node.js: $(node --version)"
echo "   • npm: $(npm --version)"
echo "   • Working directory: $(pwd)"
echo "   • Port: 5173"
echo "   • Backend: $API_URL"
echo ""
echo "🚀 To start the frontend dev server, run:"
echo ""
echo "   npm run dev"
echo ""
echo "💡 Or run this script with --start flag:"
echo ""
echo "   ./startup.sh --start"
echo ""
echo "🌐 Access URLs (RunPod):"
echo "   • Local: http://localhost:5173"
echo "   • Network: http://0.0.0.0:5173"
echo "   • RunPod Public: https://xxxxx-5173.proxy.runpod.net"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ==========================================
# 6. AUTO-START IF REQUESTED
# ==========================================
if [ "$1" == "--start" ] || [ "$1" == "-s" ]; then
    echo "🚀 Starting frontend dev server..."
    echo ""
    npm run dev
fi
