# 🚀 RunPod Deployment Guide - Verba

Guía completa para deployar Verba (backend + frontend) en RunPod.

## 📋 Prerequisitos

- Cuenta de RunPod
- GROQ API Key ([obtener aquí](https://console.groq.com))
- Pod de RunPod con GPU (recomendado: RTX 4090 o superior)

---

## 🔧 Setup Completo (Copy-Paste)

### Paso 1: Instalar Dependencias del Sistema

```bash
# Actualizar apt e instalar dependencias
apt-get update && apt-get install -y \
    portaudio19-dev \
    ffmpeg \
    curl \
    git

# Instalar Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verificar instalaciones
python --version
node --version
npm --version
```

### Paso 2: Setup del Backend

```bash
# Ir al directorio del backend
cd /workspace/testing-mvp-sesame

# Instalar dependencias Python
pip install -r requirements.txt

# Crear archivo .env con tu API key
cat > .env << 'EOF'
GROQ_API_KEY=tu_groq_api_key_aqui
WHISPER_MODEL=base
TTS_VOICE=en-US-Neural2-C
HOST=0.0.0.0
PORT=8000
EOF

# IMPORTANTE: Reemplazar con tu API key real
echo "GROQ_API_KEY=gsk_tu_key_real_aqui" > .env
```

### Paso 3: Setup del Frontend

```bash
# Ir al directorio del frontend
cd /workspace/UI-verba-mvp

# Instalar dependencias
npm install

# Crear archivo .env
# IMPORTANTE: Usar la URL pública de tu RunPod
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
EOF
```

### Paso 4: Exponer Puertos en RunPod

En la interfaz web de RunPod, expone estos puertos:

- **Puerto 8000** → Backend (FastAPI)
- **Puerto 5173** → Frontend (Vite)

RunPod te dará URLs como:
- `https://xxxxx-8000.proxy.runpod.net` (Backend)
- `https://xxxxx-5173.proxy.runpod.net` (Frontend)

### Paso 5: Actualizar URLs del Frontend

Una vez que tengas las URLs públicas de RunPod:

```bash
cd /workspace/UI-verba-mvp

# Reemplazar con tus URLs reales de RunPod
cat > .env << 'EOF'
VITE_API_URL=https://xxxxx-8000.proxy.runpod.net
VITE_WS_URL=wss://xxxxx-8000.proxy.runpod.net
EOF
```

**⚠️ IMPORTANTE**: Nota que para WebSocket usamos `wss://` (secure WebSocket) en lugar de `ws://`.

### Paso 6: Iniciar Servicios

**Terminal 1 - Backend:**
```bash
cd /workspace/testing-mvp-sesame
python server.py
```

Deberías ver:
```
Loading models...
Models loaded!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
cd /workspace/UI-verba-mvp
npm run dev
```

Deberías ver:
```
  VITE v7.2.4  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://0.0.0.0:5173/
```

---

## 🌐 Acceso a la Aplicación

1. Abre tu navegador
2. Ve a la URL del frontend que RunPod te proporcionó:
   ```
   https://xxxxx-5173.proxy.runpod.net
   ```
3. ¡Listo! Deberías ver la interfaz de Verba

---

## 🎯 Script de Inicio Automático

Crea un script para iniciar ambos servicios:

```bash
cat > /workspace/start_verba.sh << 'SCRIPT'
#!/bin/bash

echo "🚀 Starting Verba on RunPod..."

# Función para cleanup
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar Backend
echo "📡 Starting Backend..."
cd /workspace/testing-mvp-sesame
python server.py &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Esperar a que el backend inicie
sleep 10

# Iniciar Frontend
echo "🎨 Starting Frontend..."
cd /workspace/UI-verba-mvp
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Services running!"
echo "   Backend: http://0.0.0.0:8000"
echo "   Frontend: http://0.0.0.0:5173"
echo ""
echo "Press Ctrl+C to stop all services"

wait
SCRIPT

chmod +x /workspace/start_verba.sh
```

Luego solo ejecuta:
```bash
/workspace/start_verba.sh
```

---

## 🐛 Troubleshooting

### Error: `portaudio.h: No such file or directory`

```bash
apt-get update
apt-get install -y portaudio19-dev
pip install pyaudio
```

### Error: `npm: command not found`

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

### Frontend no conecta al backend

1. **Verificar que el backend está corriendo:**
   ```bash
   curl http://localhost:8000
   ```

2. **Verificar URLs en .env del frontend:**
   ```bash
   cat /workspace/UI-verba-mvp/.env
   ```

   Debe apuntar a las URLs públicas de RunPod.

3. **Reiniciar frontend:**
   ```bash
   cd /workspace/UI-verba-mvp
   # Ctrl+C para detener
   npm run dev
   ```

### WebSocket no conecta

Asegúrate de usar `wss://` (no `ws://`) en el `.env` del frontend:

```env
VITE_WS_URL=wss://xxxxx-8000.proxy.runpod.net
```

### CORS errors

El backend ya tiene CORS configurado. Si aún tienes problemas, verifica que las URLs en el frontend coincidan exactamente con las de RunPod.

---

## 🔒 Seguridad

### Proteger tu API Key

**NUNCA** commitees el archivo `.env` con tu API key real.

El `.gitignore` ya está configurado para ignorar `.env`.

### Variables de Entorno Seguras en RunPod

RunPod permite configurar variables de entorno en la UI. Úsalas para:

```bash
# En lugar de hardcodear en .env, usa variables de RunPod
export GROQ_API_KEY=$GROQ_API_KEY
```

---

## 📊 Monitoreo

### Ver logs del backend
```bash
cd /workspace/testing-mvp-sesame
python server.py | tee backend.log
```

### Ver logs del frontend
```bash
cd /workspace/UI-verba-mvp
npm run dev | tee frontend.log
```

### Monitorear uso de GPU
```bash
watch nvidia-smi
```

---

## 🚀 Optimizaciones para Producción

### 1. Build del Frontend

Para producción, haz un build optimizado:

```bash
cd /workspace/UI-verba-mvp
npm run build

# Servir con un servidor estático
npm install -g serve
serve -s dist -l 5173
```

### 2. Usar Gunicorn para el Backend

```bash
pip install gunicorn

cd /workspace/testing-mvp-sesame
gunicorn server:app \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000
```

### 3. Configurar Nginx (Opcional)

Si quieres servir ambos desde el mismo puerto:

```bash
apt-get install -y nginx

# Configurar nginx.conf para proxy reverse
# Frontend en / → localhost:5173
# Backend en /api → localhost:8000
```

---

## 📦 Persistencia de Datos

RunPod puede perder datos al reiniciar. Para persistir:

### Usar Volúmenes de RunPod

1. En la UI de RunPod, monta un volumen persistente
2. Guarda modelos descargados ahí:

```bash
# Crear directorio para modelos
mkdir -p /workspace/persistent/models

# Configurar variable de entorno
export HF_HOME=/workspace/persistent/models
export TRANSFORMERS_CACHE=/workspace/persistent/models
```

---

## ✅ Checklist de Deployment

- [ ] Dependencias del sistema instaladas (PortAudio, FFmpeg, Node.js)
- [ ] Backend dependencies instaladas (`pip install -r requirements.txt`)
- [ ] Frontend dependencies instaladas (`npm install`)
- [ ] `.env` del backend configurado con GROQ_API_KEY
- [ ] `.env` del frontend configurado con URLs de RunPod
- [ ] Puertos 8000 y 5173 expuestos en RunPod
- [ ] Backend corriendo y respondiendo
- [ ] Frontend corriendo y accesible
- [ ] WebSocket conectando correctamente
- [ ] Audio capturando y reproduciendo

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs del backend y frontend
2. Verifica las URLs en `.env`
3. Asegúrate de que los puertos estén expuestos en RunPod
4. Consulta [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) para más detalles
5. Revisa [QUICK_TEST.md](QUICK_TEST.md) para testing

---

## 💡 Tips para RunPod

1. **Guarda tu trabajo**: Los pods pueden detenerse. Haz commits frecuentes.
2. **Usa snapshots**: RunPod permite crear snapshots de tu pod configurado.
3. **Monitorea costos**: Los pods con GPU cuestan por hora.
4. **Optimiza modelos**: Usa modelos más pequeños si la latencia es un problema.

---

**¡Listo para usar Verba en RunPod!** 🎉
