# Verba - English Practice Voice Agent (Frontend)

Interfaz web moderna para practicar inglés conversacional con un agente de voz impulsado por IA.

![Verba Screenshot](public/screenshot.png)

## 🌟 Características

- 🎤 **Conversación de voz en tiempo real** con streaming bidireccional
- 🗣️ **Múltiples voces TTS** para personalización
- 📝 **Transcripciones en vivo** de tu conversación
- 📊 **Feedback instantáneo** (próximamente)
- 🎯 **Tareas asignadas** para práctica dirigida
- 🔄 **Detección de interrupciones** (barge-in) para conversaciones naturales

## 🏗️ Arquitectura

Este frontend se conecta a un backend de FastAPI que maneja:
- Voice Activity Detection (VAD)
- Speech-to-Text (Whisper)
- Language Model (Groq)
- Text-to-Speech

**Stack Frontend:**
- React 19 + TypeScript
- Vite
- Web Audio API
- WebSockets
- Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Backend running (ver [testing-mvp-sesame](../testing-mvp-sesame))

### Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### Iniciar Frontend y Backend juntos

```bash
# Ejecutar script de desarrollo completo
npm run dev:full
```

Este script inicia automáticamente tanto el backend como el frontend.

## 📖 Documentación

- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Guía completa de integración frontend-backend
- Ver también: Backend [README](../testing-mvp-sesame/README.md)

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### Scripts Disponibles

```bash
npm run dev          # Iniciar frontend solamente
npm run dev:full     # Iniciar frontend + backend
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Ejecutar linter
npm run check:backend # Verificar si el backend está corriendo
```

## 🎯 Uso

1. **Iniciar la aplicación**
   - Navega a `http://localhost:5173`

2. **Seleccionar una tarea (opcional)**
   - En la página principal, selecciona una tarea de práctica
   - O ve directamente a conversación libre

3. **Iniciar conversación**
   - Haz clic en "Empezar Clase"
   - Concede permisos de micrófono
   - Comienza a hablar en inglés

4. **Conversar**
   - Habla naturalmente
   - El agente responderá con voz
   - Puedes interrumpir al agente en cualquier momento

5. **Terminar**
   - Haz clic en "Terminar Clase"

## 🛠️ Desarrollo

### Estructura de Archivos

```
src/
├── components/          # Componentes reutilizables
│   └── TaskCard.tsx
├── hooks/              # Custom hooks
│   └── useVoiceConversation.ts  # Hook principal de conversación
├── pages/              # Páginas de la aplicación
│   ├── TasksPage.tsx
│   └── ConversationPageNew.tsx
├── services/           # Servicios y clientes API
│   └── api.ts
├── utils/              # Utilidades
│   └── audioHelpers.ts  # Procesamiento de audio
├── data/               # Datos mock
│   └── mockTasks.ts
└── App.tsx             # Componente raíz
```

### Flujo de Datos

```
Usuario → Micrófono → Web Audio API → WebSocket → Backend
                                                      ↓
                                                   AI Pipeline
                                                      ↓
Usuario ← Speakers ← Web Audio API ← WebSocket ← TTS Audio
```

## 🐛 Troubleshooting

### El frontend no se conecta

1. Verifica que el backend esté corriendo:
   ```bash
   npm run check:backend
   ```

2. Revisa las variables de entorno en `.env`

3. Revisa la consola del navegador para errores

### No se captura audio

1. Verifica permisos de micrófono en el navegador
2. Usa Chrome o Edge (Safari tiene limitaciones)
3. Verifica que el micrófono funcione en configuración del sistema

### Más ayuda

Ver [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md#troubleshooting) para guía completa de troubleshooting.

## 📝 To-Do

- [ ] Implementar feedback de pronunciación en tiempo real
- [ ] Agregar visualización de forma de onda
- [ ] Implementar historial de conversaciones
- [ ] Agregar soporte para modo offline
- [ ] Implementar tests unitarios y E2E
- [ ] Optimizar bundle size

## 🤝 Contribuir

Este es un MVP en desarrollo activo. Sugerencias y contribuciones son bienvenidas.

## 📄 Licencia

MIT

---

**Nota**: Este frontend requiere el backend [testing-mvp-sesame](../testing-mvp-sesame) para funcionar correctamente.
