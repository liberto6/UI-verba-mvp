#!/bin/bash

# Script para arreglar el .env en RunPod

echo "🔧 Fixing .env for RunPod..."
echo ""

# Detectar ID de RunPod desde hostname o usar placeholder
RUNPOD_ID=$(hostname | grep -o '^[^-]*')

if [ -z "$RUNPOD_ID" ]; then
    echo "⚠️  No se pudo detectar el ID de RunPod automáticamente"
    echo "   Por favor, ingresa tu ID de RunPod (ej: j33itoywcyver3):"
    read RUNPOD_ID
fi

echo "📝 Configurando .env con ID: $RUNPOD_ID"
echo ""

# Crear .env con las URLs correctas
cat > .env << EOF
VITE_API_URL=https://${RUNPOD_ID}-8000.proxy.runpod.net
VITE_WS_URL=wss://${RUNPOD_ID}-8000.proxy.runpod.net
EOF

echo "✅ .env actualizado:"
cat .env

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  IMPORTANTE: Debes REINICIAR el frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Detén el frontend (Ctrl+C)"
echo "2. Ejecuta: npm run dev"
echo "3. Refresca el navegador (Ctrl+Shift+R)"
echo ""
