# 🧪 Quick Test Guide - Verba Integration

Guía rápida para probar la integración frontend-backend.

## ⚡ Test Rápido (5 minutos)

### 1. Prerequisitos

```bash
# Verificar Node.js
node --version  # Debe ser >= 18

# Verificar Python
python --version  # Debe ser >= 3.8

# Verificar que tienes los repositorios
ls ../ | grep -E '(UI-verba-mvp|testing-mvp-sesame)'
```

### 2. Setup Backend (Primera vez)

```bash
cd ../testing-mvp-sesame/testing-mvp-sesame

# Instalar dependencias
pip install -r requirements.txt

# Crear .env (si no existe)
echo "GROQ_API_KEY=your_api_key_here" > .env

# Iniciar backend
python server.py
```

**Esperado**: Ver "Models loaded!" en la terminal.

### 3. Setup Frontend (Primera vez)

```bash
cd ../../UI-verba-mvp

# Instalar dependencias
npm install

# El .env ya está creado, verificar
cat .env
```

**Esperado**: Ver URLs de localhost:8000

### 4. Iniciar Aplicación

**Opción A - Script Automático (Recomendado)**:
```bash
npm run dev:full
```

**Opción B - Manual**:
```bash
# Terminal 1
cd ../testing-mvp-sesame/testing-mvp-sesame
python server.py

# Terminal 2
cd ../../UI-verba-mvp
npm run dev
```

### 5. Probar en Navegador

1. Abrir: `http://localhost:5173`

2. **Test de Conexión**:
   - Deberías ver la página de Tasks
   - Click en cualquier tarea o el botón de conversación
   - Verificar que el indicador muestre "Disconnected" (normal, aún no iniciaste)

3. **Test de Inicio**:
   - Click en "Empezar Clase"
   - Permitir acceso al micrófono cuando el navegador lo solicite
   - Esperar a ver "Connected" en verde
   - Estado debe cambiar a "Listening..."

4. **Test de Audio**:
   - Hablar en inglés (ej: "Hello, how are you?")
   - Ver tu mensaje aparecer en el transcript
   - Esperar respuesta del AI
   - Audio debe reproducirse automáticamente

5. **Test de Interrupción**:
   - Mientras el AI habla, empieza a hablar tú
   - El audio del AI debe cortarse
   - Tu nuevo mensaje debe ser procesado

6. **Test de Cambio de Voz**:
   - Click en el selector de voz (dropdown con Volume2 icon)
   - Seleccionar otra voz
   - Siguiente respuesta debe usar la nueva voz

7. **Test de Finalización**:
   - Click en "Terminar Clase"
   - Estado debe volver a "Disconnected"
   - Timer debe detenerse

## ✅ Checklist de Funcionalidad

| Feature | Funciona | Notas |
|---------|----------|-------|
| Frontend carga | ☐ | `http://localhost:5173` |
| Backend responde | ☐ | `http://localhost:8000` |
| WebSocket conecta | ☐ | Icono WiFi verde |
| Micrófono captura | ☐ | Waveform visible al hablar |
| VAD detecta voz | ☐ | Backend logs muestran "Started speaking" |
| Transcripción aparece | ☐ | Tu mensaje en transcript |
| LLM genera respuesta | ☐ | Mensaje del AI aparece |
| TTS reproduce audio | ☐ | Escuchas la voz del AI |
| Interrupción funciona | ☐ | Puedes cortar al AI |
| Cambio de voz funciona | ☐ | Voz cambia |
| Reconexión funciona | ☐ | Reinicia backend, frontend reconecta |

## 🐛 Problemas Comunes y Soluciones Rápidas

### Backend no inicia

```bash
# Error: No module named 'fastapi'
pip install -r requirements.txt

# Error: GROQ_API_KEY not found
echo "GROQ_API_KEY=your_key" > .env
```

### Frontend no conecta

```bash
# Verificar que backend está corriendo
curl http://localhost:8000

# Si da error, iniciar backend
cd ../testing-mvp-sesame/testing-mvp-sesame
python server.py
```

### Audio no se captura

1. **Chrome DevTools → Console**: Buscar errores de permisos
2. **Configuración del sistema**: Verificar que el micrófono funciona
3. **Navegador**: Usar Chrome/Edge, no Safari

### Audio no se reproduce

1. **Chrome DevTools → Console**: Buscar errores de Web Audio API
2. **Volumen del sistema**: Verificar que no esté silenciado
3. **Backend logs**: Verificar que TTS está generando audio

### WebSocket desconecta

```bash
# Ver logs del backend
# Buscar líneas como "WebSocket disconnected"

# Reiniciar backend
# Ctrl+C y volver a correr python server.py

# Frontend debería reconectar automáticamente
```

## 📊 Logs Esperados

### Backend (Flujo Normal)

```
Loading models...
Models loaded!
INFO:     Uvicorn running on http://0.0.0.0:8000
WebSocket connected
[User] Started speaking...
[User] Finished speaking. (X frames)
[Pipeline] 🎤 Starting ASR...
[Pipeline] ✅ ASR Finished in X.XXXs. User said: 'Hello'
[Pipeline] 🧠 Starting LLM generation...
[Pipeline] 🗣️  Starting TTS generation...
[Pipeline] ⚡ LATENCY REPORT:
  - Total Latency: X.XXXs
  - ASR Duration: X.XXXs
  - Processing (LLM+TTS) Latency: X.XXXs
[Pipeline] 🏁 Turn finished. Total duration: X.XXXs
```

### Frontend (Console)

```
🔌 Connecting to WebSocket: ws://localhost:8000/ws
✅ WebSocket connected
✅ Microphone initialized
🎤 Audio capture started
📨 Control message: {type: "TRANSCRIPT", text: "Hello"}
```

## 🎯 Test Cases Avanzados

### Test 1: Latencia

1. Medir tiempo desde que terminas de hablar hasta que escuchas la respuesta
2. **Esperado**: < 3 segundos (depende del backend)

### Test 2: Sesión Larga

1. Iniciar conversación
2. Hablar 10+ turnos
3. Verificar que no hay memory leaks
4. **Esperado**: Todo sigue funcionando, sin lag

### Test 3: Red Lenta

1. Chrome DevTools → Network → Throttling → "Slow 3G"
2. Iniciar conversación
3. **Esperado**: Funciona pero con más latencia

### Test 4: Reconexión

1. Iniciar conversación
2. Detener backend (Ctrl+C)
3. Esperar error en frontend
4. Reiniciar backend
5. **Esperado**: Frontend reconecta en ~3 segundos

## 📈 Métricas de Performance

Usar Chrome DevTools → Performance para medir:

- **CPU Usage**: Debe ser < 50% en idle
- **Memory**: No debe crecer continuamente
- **Network**: Flujo constante de binary messages en WebSocket

## ✅ Test Exitoso

Si todos los items del checklist están marcados, la integración funciona correctamente.

## 🆘 Si Nada Funciona

1. **Leer logs completos** de backend y frontend
2. **Verificar versiones** de Node y Python
3. **Revisar** [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md#troubleshooting)
4. **Verificar permisos** de micrófono en configuración del sistema
5. **Probar en otro navegador** (Chrome recomendado)

## 📞 Debug Avanzado

### Backend

```bash
# Ver logs detallados
python server.py | tee backend.log

# Verificar puerto
lsof -i :8000

# Matar proceso si está colgado
kill -9 $(lsof -t -i:8000)
```

### Frontend

```bash
# Ver logs de Vite
npm run dev | tee frontend.log

# Build para verificar errores
npm run build

# Verificar puerto
lsof -i :5173
```

---

**Tiempo estimado de testing completo**: 10-15 minutos
**Prerequisito**: Backend y frontend instalados correctamente
**Resultado esperado**: Conversación funcional de voz end-to-end
