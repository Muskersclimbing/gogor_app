# Diseño de UI - El Vuelo del Cuervo

## Concepto visual

App minimalista enfocada en la funcionalidad, inspirada en la estética de escalada y montaña.

**Paleta de colores:**
- **Primary:** #2C5F2D (Verde montaña oscuro)
- **Secondary:** #97BC62 (Verde claro)
- **Accent:** #FF6B35 (Naranja cuervo)
- **Background:** #F5F5F5 (Gris claro)
- **Text:** #1A1A1A (Negro suave)
- **Success:** #4CAF50
- **Error:** #F44336

---

## Pantallas

### 1. Pantalla de Inicio (Home)
**Ruta:** `app/(tabs)/index.tsx`

**Contenido:**
- Logo o título "El Vuelo del Cuervo"
- Ilustración simple de un cuervo
- Botón grande "Conectar Tindeq"
- Estado de Bluetooth (activado/desactivado)

**Flujo:**
1. Usuario abre la app
2. Ve el botón "Conectar Tindeq"
3. Al tocar, va a pantalla de conexión

---

### 2. Pantalla de Conexión Bluetooth
**Ruta:** `app/connect.tsx`

**Contenido:**
- Indicador de búsqueda (spinner)
- Lista de dispositivos Bluetooth encontrados
- Cada dispositivo muestra:
  - Nombre
  - Nivel de batería (si disponible)
  - Botón "Conectar"
- Botón "Cancelar" para volver

**Flujo:**
1. App busca dispositivos Bluetooth
2. Muestra lista de dispositivos encontrados
3. Usuario selecciona Tindeq
4. App se conecta
5. Va a pantalla del juego

---

### 3. Pantalla del Juego
**Ruta:** `app/game.tsx`

**Contenido principal:**
- **Indicador de fuerza grande** (centro de la pantalla)
  - Número grande mostrando kg actual
  - Barra visual de progreso
  
- **Objetivo de fuerza**
  - "Objetivo: XX kg"
  - Indicador visual de zona objetivo
  
- **Cronómetro**
  - Tiempo restante en grande
  - Formato: "00:15"
  
- **Botones de control:**
  - "Iniciar" / "Detener"
  - "Calibrar" (TARE)
  
- **Estado de conexión:**
  - Icono de Bluetooth
  - Nivel de batería del Tindeq

**Layout:**
```
┌─────────────────────────┐
│  🔋 95%    Bluetooth ✓  │
├─────────────────────────┤
│                         │
│     Objetivo: 25 kg     │
│                         │
│    ┌───────────────┐    │
│    │               │    │
│    │    32.5 kg    │    │  <- Fuerza actual (grande)
│    │               │    │
│    └───────────────┘    │
│                         │
│   [████████░░░░░░░]     │  <- Barra de progreso
│                         │
│        00:15            │  <- Cronómetro
│                         │
│   [  INICIAR  ]         │  <- Botón principal
│   [  CALIBRAR ]         │  <- Botón secundario
│                         │
└─────────────────────────┘
```

---

### 4. Pantalla de Resultados
**Ruta:** `app/results.tsx`

**Contenido:**
- Título "¡Partida completada!"
- **Puntuación final** (grande)
- **Estadísticas:**
  - Fuerza promedio
  - Fuerza máxima
  - Precisión (% dentro del objetivo)
  - Tiempo total
- Botón "Jugar de nuevo"
- Botón "Volver al inicio"

---

## Componentes reutilizables

### `ForceDisplay.tsx`
Muestra la fuerza actual en grande con animación suave

### `Timer.tsx`
Cronómetro con formato MM:SS

### `ProgressBar.tsx`
Barra de progreso visual para mostrar fuerza vs objetivo

### `BluetoothStatus.tsx`
Indicador de estado de conexión Bluetooth y batería

---

## Iconos necesarios

- Bluetooth (conectado/desconectado)
- Batería (niveles)
- Cuervo (logo)
- Play/Stop
- Calibrar/Reset

---

## Animaciones

- **Transición entre pantallas:** Slide suave (300ms)
- **Actualización de fuerza:** Interpolación suave (no saltos bruscos)
- **Botones:** Scale 0.97 al presionar + haptic feedback
- **Cronómetro:** Cambio de color cuando quedan <5 segundos (rojo parpadeante)

---

## Tipografía

- **Números grandes (fuerza):** 72px, bold
- **Títulos:** 24px, semibold
- **Texto normal:** 16px, regular
- **Texto pequeño:** 12px, regular

---

## Responsive

- Diseño para móvil portrait (9:16)
- Uso de SafeArea para notch/barra inferior
- Botones grandes (mínimo 48px altura) para fácil toque
