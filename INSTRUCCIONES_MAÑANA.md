# Instrucciones para Mañana - 26 de Enero

## Problema Identificado
Tu carpeta `muskers_app` en el Mac **NO tiene los cambios** que hicimos en el sandbox:
- El texto sigue siendo "Buscar Tindeq" (debería ser "Buscar Dispositivo")
- La detección de Force Board no funciona (cambio en `force-device-service.ts`)

## Solución

### Opción 1: Descargar la carpeta actualizada del sandbox (RECOMENDADO)

1. **Comprime la carpeta actualizada en el sandbox:**
```bash
cd /home/ubuntu && tar -czf muskers_app_updated.tar.gz muskers_app/
```

2. **Sube a Google Drive o Manus CDN**

3. **En tu Mac, descarga y descomprime**

4. **Reemplaza tu carpeta actual:**
```bash
rm -rf ~/Desktop/muskers_app_old
mv ~/Desktop/muskers_app ~/Desktop/muskers_app_old
# Descomprime la nueva carpeta aquí
```

5. **Compila el APK:**
```bash
cd ~/Desktop/muskers_app/android && rm -rf app/build && ./gradlew assembleRelease
```

### Opción 2: Copiar solo los archivos modificados

Los archivos que cambiaron:
- `/home/ubuntu/muskers_app/app/connect.tsx`
- `/home/ubuntu/muskers_app/lib/force-device-service.ts`

Descarga estos dos archivos y reemplaza en tu Mac.

## Cambios Realizados en el Sandbox

### 1. `connect.tsx` - Línea 148
**Antes:** `Buscar Tindeq`
**Después:** `Buscar Dispositivo`

### 2. `force-device-service.ts` - Línea 111
**Antes:** `if (name.includes('force board'))`
**Después:** `if (name.includes('force'))`

## Próximos Pasos Mañana

1. ✅ Actualizar la carpeta en tu Mac
2. ✅ Compilar APK con `rm -rf app/build && ./gradlew assembleRelease`
3. ✅ Instalar en Android
4. ✅ Probar con Force Board en modo emparejamiento (LED rojo parpadeando)
5. ✅ Verificar que aparece "Buscar Dispositivo"
6. ✅ Verificar que detecta Force Board

## Estado Actual

- ✅ Tindeq Progressor: Detecta y funciona perfectamente
- ✅ Música y sonidos: Intactos y funcionando
- ✅ Juego: Funciona perfectamente
- ❌ Force Board: No detecta (por falta de actualización en tu Mac)
- ❌ Texto: Sigue diciendo "Buscar Tindeq"

## Checkpoint en Sandbox

Versión: `7f4c04a6`
Todos los cambios están guardados en el sandbox.
