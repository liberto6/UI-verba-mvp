# Configuración para RunPod

Este documento explica cómo configurar las URLs cuando cambies de pod en RunPod.

## Configuración del archivo .env

Cuando levantes un nuevo pod en RunPod, debes actualizar el archivo `.env` con las nuevas URLs:

1. Copia el archivo `.env.example` a `.env` si aún no existe:
   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` y reemplaza las URLs con las de tu pod activo:
   ```env
   VITE_API_URL=https://[TU_POD_ID]-5173.proxy.runpod.net
   VITE_WS_URL=wss://[TU_POD_ID]-8000.proxy.runpod.net
   ```

   **Ejemplo con un pod real:**
   ```env
   VITE_API_URL=https://fbwy26588fnem1-5173.proxy.runpod.net
   VITE_WS_URL=wss://fbwy26588fnem1-8000.proxy.runpod.net
   ```

3. Guarda el archivo y reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Formato de las URLs de RunPod

Las URLs de RunPod siguen este formato:
- **HTTPS/WSS**: `https://[POD_ID]-[PUERTO].proxy.runpod.net`
- **HTTP/WS** (local): `http://localhost:[PUERTO]`

Donde:
- `[POD_ID]`: Es el identificador único de tu pod (ej: `fbwy26588fnem1`)
- `[PUERTO]`: Es el puerto que estás exponiendo (ej: `5173` para el frontend, `8000` para el backend)

## Desarrollo Local

Para desarrollo local, usa estas configuraciones en tu `.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Notas Importantes

- ⚠️ **NO** commits el archivo `.env` con las URLs de RunPod al repositorio
- ✅ El archivo `.env.example` es el que debe estar en el repositorio
- 🔄 Cada vez que cambies de pod, deberás actualizar estas URLs
