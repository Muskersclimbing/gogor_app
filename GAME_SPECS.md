# Especificaciones del Juego - Gogor Games

## Resumen de Mockups del Usuario

### Layout de UI (según juegoindicaciones.jpg):

**Top Left:** 
- Contador de frutos: "5/25" (frutos recogidos / total objetivo)

**Top Center:**
- Indicadores visuales de progreso: 4 fresas pixel art

**Top Right:**
- Fuerza actual en tiempo real: "5.1Kg"

**Centro:**
- Pájaro geométrico simple y minimal con leve movimiento de vuelo
- Obstáculos geométricos (columnas/pilares estilo Alto's Adventure)
- Frutos pixel art flotando (bananas, fresas, etc.)
- Fondo fotográfico de escalada (Monument Valley en el mockup)

**Bottom Left:**
- Tiempo restante: "2:35"

**Bottom Right:**
- Botón STOP (círculo blanco con cuadrado)

### Mecánica del Juego (según anotaciones):

1. **Pájaro:**
   - "Cuervo simple y minimal con un leve movimiento que asemeje su vuelo"
   - Movimiento controlado por fuerza del Tindeq
   - Más fuerza = pájaro sube
   - Menos fuerza = pájaro baja (gravedad)

2. **Frutos:**
   - "Utilizar los frutos para marcar la dirección"
   - **Isométrico:** Frutos en horizontal en lo alto (mantener fuerza constante)
   - **Excéntrico suave:** Frutos en diagonal descendente
   - **Concéntrico rápido:** Frutos intercalados arriba y abajo

3. **Obstáculos:**
   - Columnas/pilares geométricos estilo Alto's Adventure
   - Color marrón/dorado para contrastar con fondo
   - El pájaro debe navegar entre ellos

4. **Colisiones:**
   - Chocar con obstáculo = perder vida (en modo Resistencia) o penalización
   - Recoger fruto = +1 al contador

## Implementación Técnica

### Física del Pájaro:
```typescript
// Posición Y del pájaro basada en fuerza
const GRAVITY = 0.5; // Píxeles por frame
const FORCE_MULTIPLIER = 2; // Sensibilidad de fuerza

birdY += GRAVITY; // Siempre cae
if (currentForce > lowZone) {
  birdY -= currentForce * FORCE_MULTIPLIER; // Fuerza lo hace subir
}
```

### Sistema de Frutos:
```typescript
interface Fruit {
  x: number;
  y: number;
  type: 'watermelon' | 'banana' | 'apple' | 'orange' | 'strawberry' | 'cherry' | 'peach' | 'pear';
  collected: boolean;
}

// Patrones de frutos según tipo de ejercicio
const PATTERNS = {
  isometric: { y: 100, spacing: 200 }, // Horizontal alto
  eccentric: { startY: 100, endY: 400, diagonal: true }, // Diagonal descendente
  concentric: { yValues: [100, 400], alternating: true } // Arriba/abajo
};
```

### Sistema de Obstáculos:
```typescript
interface Obstacle {
  x: number;
  topHeight: number; // Altura del obstáculo superior
  gapY: number; // Posición Y del hueco
  gapHeight: number; // Altura del hueco (espacio para pasar)
}

const GAP_HEIGHT = 200; // Espacio para que pase el pájaro
const OBSTACLE_SPACING = 300; // Distancia entre obstáculos
```

### Detección de Colisiones:
```typescript
// Colisión con obstáculo
if (birdX + birdWidth > obstacleX && 
    birdX < obstacleX + obstacleWidth &&
    (birdY < obstacleGapY || birdY + birdHeight > obstacleGapY + gapHeight)) {
  handleCollision();
}

// Recolección de fruto
if (distance(bird, fruit) < 30 && !fruit.collected) {
  collectFruit(fruit);
}
```

### Scrolling:
```typescript
const SCROLL_SPEED = 2; // Píxeles por frame
// Mover obstáculos y frutos hacia la izquierda
obstacles.forEach(obs => obs.x -= SCROLL_SPEED);
fruits.forEach(fruit => fruit.x -= SCROLL_SPEED);
```

## Estética Alto's Adventure

### Características:
- Colores suaves y cálidos
- Geometría simple y limpia
- Animaciones sutiles
- Transiciones suaves
- UI minimalista
- Fondo fotográfico con overlay sutil para legibilidad

### Paleta de Colores:
- Pájaro: Negro/gris oscuro (silueta)
- Obstáculos: Marrón/dorado (#8B7355, #C4A57B)
- UI: Beige/crema (#F5E6D3)
- Texto: Marrón oscuro (#5C4A3A)

## Rotación de Fondos

### Secuencia:
1. **Yosemite** (montaña, bosque) → música: mountain.wav
2. **Monument Valley** (desierto, formaciones rocosas) → música: desert.wav
3. **Albarracín** (pueblo, roca roja) → música: forest.wav
4. **Fontainebleau** (bosque, rocas) → música: mountain.wav

### Transiciones:
- Entre intervalos de ejercicio
- 10 segundos de descanso con transición a versión nocturna
- Mensaje: "Descansa... respira..."
- Fade in/out suave

## Objetivos por Modalidad

### Calentamiento Rápido (3 min):
- Recoger 15 frutos
- 1 escenario (Yosemite)
- Sin transición nocturna

### Calentamiento Total (5 min):
- Recoger 25 frutos
- 2 escenarios (Yosemite → Monument Valley)
- 1 transición nocturna a los 2 minutos

### Resistencia (sin límite):
- Recoger máximo de frutos posible
- 3 vidas
- 4 escenarios rotativos
- Transición nocturna entre cada escenario
