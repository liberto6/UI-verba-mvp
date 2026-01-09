# 🚀 RunPod Quick Start - Verba

Guía ultra-rápida para deployar Verba en RunPod en 3 pasos.

---

## ⚡ Opción 1: Inicio Automático (RECOMENDADO)

Un solo comando para iniciar todo:

```bash
cd /workspace/UI-verba-mvp
./startup-all.sh
```

Esto:
- ✅ Instala todas las dependencias del sistema
- ✅ Instala Node.js si no existe
- ✅ Instala dependencias Python y npm
- ✅ Verifica configuración
- ✅ Inicia backend y frontend automáticamente

**IMPORTANTE**: Antes de ejecutar, configura tu GROQ API key:

```bash
echo "GROQ_API_KEY=gsk_tu_key_real" > /workspace/testing-mvp-sesame/.env
```

---

## ⚡ Opción 2: Inicio Separado

### Backend

```bash
cd /workspace/testing-mvp-sesame

# Setup y verificación
./startup.sh

# Iniciar servidor
python server.py

# O todo en uno:
./startup.sh --start
```

### Frontend (en otra terminal)

```bash
cd /workspace/UI-verba-mvp

# Setup y verificación
./startup.sh

# Iniciar servidor
npm run dev

# O todo en uno:
./startup.sh --start
```

---

## 🔑 Configuración Requerida

### 1. Backend `.env`

```bash
cd /workspace/testing-mvp-sesame
echo "GROQ_API_KEY=gsk_tu_api_key_real" > .env
```

### 2. Frontend `.env` (para RunPod)

```bash
cd /workspace/UI-verba-mvp

# Reemplaza xxxxx con tu ID de RunPod
cat > .env << 'EOF'
VITE_API_URL=https://xxxxx-8000.proxy.runpod.net
VITE_WS_URL=wss://xxxxx-8000.proxy.runpod.net
EOF
```

**Para desarrollo local** (si backend está en la misma máquina):
```bash
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
EOF
```

---

## 🌐 Exponer Puertos en RunPod

En la interfaz de RunPod, expone estos puertos:

- **8000** → Backend (FastAPI)
- **5173** → Frontend (Vite)

RunPod te dará URLs públicas:
- `https://xxxxx-8000.proxy.runpod.net` (Backend)
- `https://xxxxx-5173.proxy.runpod.net` (Frontend)

Usa estas URLs en el `.env` del frontend.

---

## ✅ Verificación

### Backend funcionando:
```bash
curl http://localhost:8000
# Debe devolver HTML
```

### Frontend funcionando:
```bash
curl http://localhost:5173
# Debe devolver HTML de la app
```

### Ver logs:
```bash
# Logs del backend
tail -f /tmp/verba-backend.log

# Logs del frontend
tail -f /tmp/verba-frontend.log
```

---

## 🎯 Flujo Completo

```bash
# 1. Configurar GROQ API Key
echo "GROQ_API_KEY=gsk_tu_key" > /workspace/testing-mvp-sesame/.env

# 2. Iniciar todo
cd /workspace/UI-verba-mvp
./startup-all.sh

# 3. Exponer puertos 8000 y 5173 en RunPod UI

# 4. Actualizar .env del frontend con URLs de RunPod
cd /workspace/UI-verba-mvp
cat > .env << 'EOF'
VITE_API_URL=https://tu-id-8000.proxy.runpod.net
VITE_WS_URL=wss://tu-id-8000.proxy.runpod.net
EOF

# 5. Reiniciar frontend (Ctrl+C y ./startup.sh --start)

# 6. Abrir navegador: https://tu-id-5173.proxy.runpod.net
```

---

## 🐛 Problemas Comunes

### "portaudio.h not found"
El script `startup.sh` lo soluciona automáticamente.

### "npm: command not found"
El script `startup.sh` instala Node.js automáticamente.

### Frontend no conecta al backend
Verifica las URLs en `/workspace/UI-verba-mvp/.env`

### WebSocket no conecta
Usa `wss://` (no `ws://`) en producción con RunPod

---

## 📋 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `startup-all.sh` | Inicia backend + frontend automáticamente |
| `startup.sh` (backend) | Setup del backend |
| `startup.sh` (frontend) | Setup del frontend |

### Flags disponibles:

```bash
# Solo setup (no inicia el servidor)
./startup.sh

# Setup + inicio automático
./startup.sh --start
./startup.sh -s
```

---

## 💾 Persistencia

Para guardar modelos descargados entre reinicios:

```bash
# Crear directorio persistente
mkdir -p /workspace/persistent/models

# Configurar variables de entorno
export HF_HOME=/workspace/persistent/models
export TRANSFORMERS_CACHE=/workspace/persistent/models

# Agregar a startup
echo "export HF_HOME=/workspace/persistent/models" >> ~/.bashrc
```

---

## 🆘 Ayuda

- **Logs detallados**: Ver [RUNPOD_DEPLOYMENT.md](RUNPOD_DEPLOYMENT.md)
- **Guía de integración**: Ver [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- **Testing**: Ver [QUICK_TEST.md](QUICK_TEST.md)

---

**¡Listo para usar Verba en RunPod!** 🎉
