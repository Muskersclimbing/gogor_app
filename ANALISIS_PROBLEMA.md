# Análisis Sistemático: Pájaro no responde a fuerza del Tindeq

## Síntomas Observados
1. Los números de fuerza en pantalla cambian correctamente (currentForce llega)
2. El pájaro cae lentamente y se queda abajo
3. Aplicando hasta 12.5kg de fuerza, el pájaro no sube
4. En algunos APKs, el pájaro ni siquiera se mueve (completamente quieto)

## Hipótesis Descartadas
1. ❌ currentForce no llega al componente → DESCARTADO (números cambian)
2. ❌ useRef no captura valores → PROBADO, no funcionó
3. ❌ setInterval no se ejecuta → PROBADO con requestAnimationFrame, no funcionó
4. ❌ useEffect con dependencias incorrectas → PROBADO sin dependencias, no funcionó

## Hipótesis Activas

### Hipótesis 1: El componente FlappyBirdGame no se está renderizando
**Evidencia**: Solo se ven círculos de colores (fallback), no sprites
**Posible causa**: Error en el render que hace que React Native muestre un fallback
**Cómo verificar**: Agregar console.log en el render y en useEffect

### Hipótesis 2: isPaused está siempre en true
**Evidencia**: El game loop tiene `if (isPaused || hasCollidedRef.current) return;`
**Posible causa**: game.tsx pasa `isPaused={!isPlaying}` y isPlaying puede ser false
**Cómo verificar**: Revisar el valor de isPlaying en game.tsx

### Hipótesis 3: La física se ejecuta pero setBirdY no actualiza la UI
**Evidencia**: En versiones anteriores funcionaba parcialmente
**Posible causa**: React Native no re-renderiza cuando cambia el estado
**Cómo verificar**: Usar console.log para ver si setBirdY se llama

### Hipótesis 4: lowZone es mayor que currentForce
**Evidencia**: La condición es `if (currentForce > lowZone)`
**Posible causa**: lowZone mal calculado (maxForce * 0.33 con maxForce de calibración)
**Cómo verificar**: Imprimir lowZone y currentForce en consola

### Hipótesis 5: El game loop se cancela inmediatamente
**Evidencia**: requestAnimationFrame puede cancelarse si hay un error
**Posible causa**: Error silencioso en el game loop
**Cómo verificar**: Wrap en try-catch y log errores

## Plan de Acción

### Paso 1: Crear versión de debug con logs
Agregar console.log en puntos clave:
- Inicio del componente
- Cada frame del game loop
- Cuando se actualiza birdY
- Valores de currentForce, lowZone, isPaused

### Paso 2: Simplificar al mínimo
Crear versión ultra-simple que SOLO:
- Muestre un círculo
- El círculo suba cuando currentForce > 5kg
- Sin obstáculos, sin frutos, sin nada más

### Paso 3: Verificar que la versión simple funciona
Si funciona → agregar complejidad gradualmente
Si no funciona → el problema está en cómo se pasa currentForce o isPaused

## Código de Test Mínimo

```typescript
export function FlappyBirdGame({ currentForce, isPaused }: Props) {
  const [birdY, setBirdY] = useState(300);
  
  useEffect(() => {
    console.log("=== GAME START ===");
    console.log("isPaused:", isPaused);
    console.log("currentForce:", currentForce);
  }, []);
  
  useEffect(() => {
    console.log("Force changed:", currentForce);
    
    if (isPaused) {
      console.log("PAUSED, not updating");
      return;
    }
    
    // Si hay fuerza, subir. Si no, bajar.
    if (currentForce > 5) {
      console.log("MOVING UP");
      setBirdY(prev => Math.max(0, prev - 10));
    } else {
      console.log("MOVING DOWN");
      setBirdY(prev => Math.min(500, prev + 2));
    }
  }, [currentForce, isPaused]);
  
  console.log("RENDER - birdY:", birdY);
  
  return (
    <View style={{ position: "absolute", left: 50, top: birdY, width: 50, height: 50, backgroundColor: "red" }} />
  );
}
```

Este test mínimo debería:
- Mostrar un cuadrado rojo
- Subir cuando aplicas >5kg
- Bajar cuando no aplicas fuerza
- Imprimir logs en cada cambio

Si esto NO funciona, el problema está en:
- isPaused está en true
- currentForce no cambia (aunque los números digan que sí)
- Hay un problema de render de React Native

## Próximos Pasos
1. Implementar test mínimo
2. Compilar APK de debug
3. Pedir al usuario que pruebe y reporte qué logs ve (si tiene adb)
4. O simplificar tanto que sea obvio qué falla


## HALLAZGO CRÍTICO

**isPlaying se setea a true en línea 357 de game.tsx**
- Esto ocurre DESPUÉS de `tindeqService.startMeasurement()`
- Si startMeasurement() falla o no se completa, isPlaying nunca se setea a true
- Entonces isPaused={!isPlaying} sería isPaused={true}
- Y el game loop tiene `if (isPaused) return;`

**ESTO EXPLICA POR QUÉ EL PÁJARO NO SE MUEVE**

El usuario reporta que:
- Los números cambian (currentForce llega correctamente)
- El pájaro no se mueve

Esto es consistente con:
- El Tindeq está conectado y enviando datos (por eso los números cambian)
- Pero isPlaying nunca se setea a true (por algún error en startMeasurement)
- Entonces el game loop está pausado

## Solución

Necesito verificar:
1. Si startMeasurement() está fallando silenciosamente
2. Si hay algún error en el try-catch que impide que isPlaying se setee
3. Agregar logs para confirmar que isPlaying se setea a true

## Test Definitivo

Voy a crear una versión que:
1. NO dependa de isPlaying para moverse
2. O que muestre visualmente si isPlaying es true o false
3. O que setee isPlaying a true inmediatamente sin esperar startMeasurement


## VERSIÓN DE TEST IMPLEMENTADA

He creado una versión ultra-simple de FlappyBirdGame que:

1. **Muestra debug info en pantalla**:
   - isPaused (TRUE/FALSE)
   - currentForce actual
   - lowZone
   - birdY (posición)
   - frames (contador de frames del game loop)

2. **Comportamiento simple**:
   - Si currentForce > lowZone: sube 5 píxeles por frame
   - Si currentForce <= lowZone: baja 2 píxeles por frame (gravedad)
   - Color cambia según fuerza (verde/amarillo/rojo)

3. **Barra visual de fuerza**:
   - En el lado derecho de la pantalla
   - Muestra visualmente cuánta fuerza se está aplicando

4. **Logs extensivos**:
   - Console.log en mount, game loop setup, cada 60 frames, etc.

**Con esta versión, el usuario podrá ver inmediatamente**:
- Si isPaused está en TRUE (causa más probable)
- Si currentForce está llegando correctamente
- Si el game loop está corriendo (frames incrementando)
- Si birdY está cambiando

**Si isPaused está en TRUE**:
- El problema está en game.tsx (isPlaying no se setea)
- Necesito arreglar startMeasurement() o setear isPlaying antes

**Si isPaused está en FALSE pero el pájaro no se mueve**:
- El problema está en el game loop o en setBirdY
- Pero al menos sabré que isPlaying funciona
