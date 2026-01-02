# Análisis de Crane LiveChart

## Estructura clave

### 1. DataManager (@Observable class)
- `currentVal`: DataPoint actual (último valor recibido)
- `rawDataPoints`: Array de valores brutos
- `interpolatedDataPoints`: Array de valores interpolados para la gráfica
- `DisplayLink`: Timer sincronizado con refresh rate (60 FPS)

### 2. Flujo de datos

```
Tindeq BLE → addDataPoint(val) → currentVal actualizado
                                → rawDataPoints.append()
                                
DisplayLink (60 FPS) → updateInterpolatedPoints()
                     → interpolatedDataPoints.append(lastPoint)
                     
SwiftUI View → ForEach(interpolatedDataPoints) → Render automático
```

### 3. Clave del éxito

**DisplayLink se ejecuta a 60 FPS independientemente de cuándo llegan los datos del Tindeq.**

- `addDataPoint()` solo actualiza `rawDataPoints`
- `updateInterpolatedPoints()` se llama cada frame (60 FPS) y copia el último valor
- SwiftUI re-renderiza automáticamente cuando `interpolatedDataPoints` cambia

## Traducción a React Native

### Equivalencias:

| Swift | React Native |
|-------|--------------|
| `@Observable class` | `useState` + `useEffect` |
| `DisplayLink` | `requestAnimationFrame` |
| `currentVal` | `currentForce` (prop) |
| `interpolatedDataPoints` | Array en `useState` |
| SwiftUI `ForEach` | React `map()` |

### Implementación:

```typescript
// Estado
const [birdY, setBirdY] = useState(SCREEN_HEIGHT / 2);
const currentForceRef = useRef(0);

// Actualizar ref cuando cambia la prop
useEffect(() => {
  currentForceRef.current = currentForce;
}, [currentForce]);

// Game loop con requestAnimationFrame (60 FPS)
useEffect(() => {
  let frameId: number;
  
  const gameLoop = () => {
    // Leer fuerza actual
    const force = currentForceRef.current;
    
    // Aplicar física
    const targetY = calculateBirdY(force);
    
    // Actualizar posición
    setBirdY(targetY);
    
    // Siguiente frame
    frameId = requestAnimationFrame(gameLoop);
  };
  
  frameId = requestAnimationFrame(gameLoop);
  
  return () => cancelAnimationFrame(frameId);
}, []);
```

## Diferencia clave con mis intentos anteriores

**ANTES**: Usaba `setInterval` que se reiniciaba cuando cambiaba `currentForce`

**AHORA**: `requestAnimationFrame` corre continuamente a 60 FPS, y lee `currentForceRef.current` en cada frame

Esto garantiza:
1. Actualización visual suave (60 FPS)
2. No se reinicia el loop cuando cambia la fuerza
3. Siempre lee el valor más reciente de la fuerza
