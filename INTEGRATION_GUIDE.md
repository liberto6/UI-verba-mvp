# Verba - Guía de Integración Frontend-Backend

Esta guía explica cómo conectar el frontend de Verba (React) con el backend (FastAPI + WebSockets).

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Prerequisitos](#prerequisitos)
3. [Configuración del Backend](#configuración-del-backend)
4. [Configuración del Frontend](#configuración-del-frontend)
5. [Desarrollo Local](#desarrollo-local)
6. [Flujo de Comunicación](#flujo-de-comunicación)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitectura

### Stack Tecnológico

**Backend (`testing-mvp-sesame`)**
- FastAPI (servidor HTTP y WebSocket)
- Silero VAD (Voice Activity Detection)
- Faster Whisper (Speech-to-Text)
- Groq LLM (generación de respuestas)
- TTS (Text-to-Speech)
- Audio: PCM 16-bit, 16kHz

**Frontend (`UI-verba-mvp`)**
- React 19 + TypeScript
- Vite (dev server y build)
- Web Audio API (captura y reproducción)
- WebSocket (comunicación bidireccional)
- Tailwind CSS

### Arquitectura de Comunicación

```
┌─────────────────┐          WebSocket          ┌─────────────────┐
│                 │◄─────────────────────────────►│                 │
│   Frontend      │   Audio Streaming (PCM)      │    Backend      │
│   (React)       │                               │   (FastAPI)     │
│                 │◄─────────────────────────────►│                 │
└─────────────────┘   Control Messages (JSON)    └─────────────────┘
        │                                                  │
        │                                                  │
        ▼                                                  ▼
┌─────────────────┐                              ┌─────────────────┐
│  Web Audio API  │                              │  AI Pipeline    │
│  - Microphone   │                              │  - VAD          │
│  - Speakers     │                              │  - Whisper STT  │
│  - Processing   │                              │  - Groq LLM     │
└─────────────────┘                              │  - TTS          │
                                                 └─────────────────┘
```

---

## ⚙️ Prerequisitos

### Backend
- Python 3.8+
- PyAudio (requiere PortAudio instalado)
- CUDA (opcional, para GPU acceleration)

### Frontend
- Node.js 18+
- npm o yarn

### Navegador
- Chrome, Edge, o cualquier navegador moderno con soporte para:
  - Web Audio API
  - WebSocket
  - getUserMedia (acceso a micrófono)

---

## 🔧 Configuración del Backend

### 1. Navegar al directorio del backend

```bash
cd ../testing-mvp-sesame/testing-mvp-sesame
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en el directorio del backend:

```env
# Groq API Key (obtener en https://console.groq.com)
GROQ_API_KEY=your_api_key_here

# Opcional: Configuración de modelos
WHISPER_MODEL=base
TTS_VOICE=en-US-Neural2-C
```

### 4. Iniciar el servidor

```bash
python server.py
```

El backend estará disponible en:
- **HTTP**: `http://localhost:8000`
- **WebSocket**: `ws://localhost:8000/ws`

### 5. Verificar que funciona

Abre en tu navegador: `http://localhost:8000`

Deberías ver la interfaz básica del backend.

---

## 🎨 Configuración del Frontend

### 1. Navegar al directorio del frontend

```bash
cd UI-verba-mvp
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

El archivo `.env` ya está creado con la configuración por defecto:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

Para producción, actualiza estos valores en `.env.production`:

```env
VITE_API_URL=https://api.tudominio.com
VITE_WS_URL=wss://api.tudominio.com
```

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

---

## 🚀 Desarrollo Local

### Levantar ambos servicios

**Terminal 1 - Backend:**
```bash
cd ../testing-mvp-sesame/testing-mvp-sesame
python server.py
```

**Terminal 2 - Frontend:**
```bash
cd UI-verba-mvp
npm run dev
```

### Flujo de trabajo

1. Abre el frontend en tu navegador: `http://localhost:5173`
2. Navega a la página de conversación
3. Haz clic en "Empezar Clase"
4. Concede permisos de micrófono cuando el navegador lo solicite
5. Habla en inglés y recibe respuestas del agente

---

## 🔄 Flujo de Comunicación

### Inicio de Conversación

```
1. Usuario presiona "Empezar Clase" en UI
   ↓
2. Frontend solicita permisos de micrófono
   ↓
3. Frontend establece conexión WebSocket con backend
   ↓
4. Backend acepta conexión y carga modelos
   ↓
5. Frontend comienza a capturar audio del micrófono
   ↓
6. Audio se convierte a PCM Int16 y se envía por WebSocket
```

### Procesamiento de Audio (Flujo Continuo)

```
Frontend (Capture)                  Backend (Processing)
─────────────────                   ────────────────────
Micrófono capture    ───PCM──►      VAD Detection
                                    │
                                    ├─► Speech detected?
                                    │   Yes: Buffer frames
                                    │   No: Ignore
                                    │
                                    ├─► Silence after speech?
                                    │   Yes: Process buffer
                                    │
                                    ├─► Whisper STT
                                    │   (transcribe audio)
                                    │
                                    ├─► Groq LLM
                                    │   (generate response)
                                    │
                                    └─► TTS
                                        (synthesize speech)
                                        │
Speaker playback     ◄───PCM───────────┘
```

### Mensajes de Control (JSON)

El backend puede enviar mensajes de control:

```json
// Limpiar buffer (interrupciones)
{
  "type": "CLEAR_BUFFER"
}

// Transcripción del usuario
{
  "type": "TRANSCRIPT",
  "text": "Hello, how are you?"
}

// Respuesta del AI
{
  "type": "AI_RESPONSE",
  "text": "I'm doing great! How can I help you practice English today?"
}

// Cambio de estado
{
  "type": "STATE_CHANGE",
  "state": "PROCESSING" | "SPEAKING" | "LISTENING"
}
```

---

## 🐛 Troubleshooting

### El frontend no se conecta al backend

**Síntomas:**
- Error: "Connection error. Please check if the backend is running."
- Estado: "Error de conexión"

**Soluciones:**

1. **Verifica que el backend esté corriendo:**
   ```bash
   # En otra terminal
   curl http://localhost:8000
   ```

2. **Verifica CORS:**
   El backend debe tener configurado CORS para aceptar requests desde `localhost:5173`.
   Esto ya está configurado en `server.py`.

3. **Verifica las URLs en `.env`:**
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_WS_URL=ws://localhost:8000
   ```

4. **Reinicia el servidor de desarrollo:**
   ```bash
   # Mata el proceso (Ctrl+C) y reinicia
   npm run dev
   ```

### No se captura audio del micrófono

**Síntomas:**
- No se detecta voz
- El backend no recibe datos

**Soluciones:**

1. **Verifica permisos del navegador:**
   - Abre DevTools → Console
   - Busca errores relacionados con `getUserMedia`
   - Concede permisos de micrófono

2. **Verifica el micrófono en configuración del sistema:**
   - macOS: System Preferences → Sound → Input
   - Windows: Settings → Sound → Input
   - Habla en el micrófono y verifica que se mueva la barra de volumen

3. **Usa Chrome/Edge en lugar de Safari:**
   Safari tiene limitaciones con Web Audio API

### Audio reproducido tiene cortes o lag

**Síntomas:**
- Audio entrecortado
- Latencia alta

**Soluciones:**

1. **Verifica la conexión de red:**
   - Si usas WiFi, intenta ethernet
   - Reduce distancia al router

2. **Cierra aplicaciones que usen mucho CPU:**
   - El procesamiento de audio requiere recursos

3. **Actualiza el backend:**
   - Usa GPU si está disponible
   - El backend usa `faster-whisper` que puede aprovechar CUDA

### El TTS no cambia de voz

**Síntomas:**
- Seleccionas una voz diferente pero sigue sonando igual

**Soluciones:**

1. **Verifica que el backend soporte múltiples voces:**
   - El endpoint `/api/set_voice` debe estar implementado
   - Verifica logs del backend al cambiar voz

2. **Reinicia la conversación:**
   - Para "Terminar Clase" y vuelve a empezar

---

## 📁 Estructura de Archivos

### Frontend

```
UI-verba-mvp/
├── src/
│   ├── hooks/
│   │   └── useVoiceConversation.ts   # Hook principal de conversación
│   ├── services/
│   │   └── api.ts                     # Cliente API
│   ├── utils/
│   │   └── audioHelpers.ts            # Procesamiento de audio
│   ├── pages/
│   │   ├── ConversationPageNew.tsx    # Página de conversación integrada
│   │   └── TasksPage.tsx              # Página de tareas
│   └── App.tsx
├── .env                                # Variables de entorno (no commit)
├── .env.example                        # Template de variables
└── INTEGRATION_GUIDE.md               # Esta guía
```

### Backend

```
testing-mvp-sesame/
├── src/
│   ├── core/
│   │   ├── vad.py           # Voice Activity Detection
│   │   ├── asr.py           # Speech-to-Text
│   │   ├── llm.py           # Language Model
│   │   ├── tts.py           # Text-to-Speech
│   │   └── orchestrator.py  # Orquestador principal
│   └── audio/
│       └── websocket_audio_manager.py  # Manejo de audio por WebSocket
├── server.py                # Servidor FastAPI
└── requirements.txt
```

---

## 🎯 Próximos Pasos

- [ ] Implementar feedback en tiempo real (pronunciación, fluidez, vocabulario)
- [ ] Agregar autenticación de usuarios
- [ ] Implementar historial de conversaciones
- [ ] Agregar más voces TTS
- [ ] Optimizar latencia con streaming bidireccional
- [ ] Deploy en producción

---

## 📞 Soporte

Si tienes problemas, revisa:
1. Esta guía de troubleshooting
2. Los logs del backend (`python server.py`)
3. La consola del navegador (DevTools → Console)
4. Los logs de red (DevTools → Network)

Para reportar bugs, crea un issue en el repositorio.
