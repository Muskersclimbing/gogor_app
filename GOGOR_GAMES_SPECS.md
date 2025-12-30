# GOGOR GAMES - Especificaciones Completas del Proyecto

## 📋 Resumen Ejecutivo

**Gogor Games** es una aplicación móvil (Android/iOS) para **calentamiento de dedos antes de sesiones de escalada**, que combina entrenamiento funcional con una experiencia visual y sonora inmersiva inspirada en Monument Valley y la música ambient de Brian Eno.

---

## 🎯 Objetivo Principal

**Calentamiento pre-escalada** que trabaja:
- Fuerza isométrica (mantener)
- Fuerza concéntrica (apretar)
- Fuerza excéntrica (soltar lentamente) → **Clave para prevenir artritis**

---

## 🔧 Hardware Compatible

1. **Tindeq Progressor** (dinamómetro Bluetooth)
2. **Force Board de Pitchsix** (plataforma de fuerza Bluetooth)
3. **Gogor** (dispositivo de entrenamiento de dedos)

**Conexión:** Gogor + Tindeq/Force Board vía muelle de diferentes durezas

---

## 🎨 Diseño Visual y Sonoro

### Estética Visual
- **Inspiración:** Monument Valley (geométrico, minimalista, naif)
- **Colores:** Suaves, atmosféricos, paletas por escenario
- **Animaciones:** Fluidas, contemplativas, sin brusquedad
- **Geometría:** Simple, sombras largas, cielos degradados

### Estética Sonora
- **Inspiración:** "Music for Airports" de Brian Eno
- **Estilo:** Ambient, drones, texturas, minimalismo
- **Sonidos naturales:** Viento, pájaros, agua
- **Transiciones:** Suaves entre escenarios
- **Filosofía:** Meditativa, zen, relajante

---

## 🗺️ Escenarios de Escalada

### 1. Yosemite (California, USA)
- **Características:** Paredes de granito, El Capitan
- **Paleta:** Grises, blancos, verdes pino
- **Momento:** Amanecer

### 2. Utah (USA)
- **Características:** Formaciones de arenisca roja, arcos
- **Paleta:** Naranjas, rojos, ocres
- **Momento:** Mediodía

### 3. Albarracín (España)
- **Características:** Bloques de rodeno, paisaje mediterráneo
- **Paleta:** Rojos rodeno, verdes mediterráneos, ocres
- **Momento:** Atardecer

### 4. Fontainebleau (Francia)
- **Características:** Bosque de bloques, naturaleza frondosa
- **Paleta:** Verdes bosque, grises piedra, marrones tierra
- **Momento:** Día nublado

---

## 🌓 Ciclo Día/Noche

### Día ☀️
- Ejercicios activos de fuerza
- Escenario iluminado
- Música activa (dentro del ambient)

### Noche 🌙 (Momentos de descanso)
- Duración: **10 segundos máximo**
- Pantalla se oscurece gradualmente
- Aparecen estrellas
- Música se vuelve más etérea
- Mensaje: "Descansa... respira..."
- Transición al nuevo escenario

### Amanecer 🌅
- Nuevo escenario
- Nueva fase de ejercicios
- Transición suave desde la noche

---

## 🔧 Sistema de Calibración

### Calibración Inicial (antes de cada partida)

**Proceso:**
1. Mensaje: "Aprieta con fuerza máxima y mantén"
2. Usuario aprieta durante 3-5 segundos
3. App detecta **fuerza máxima sostenida** (no picos)
4. App calcula automáticamente las 3 zonas

**Cálculo de zonas:**
```
Fuerza Máxima = FM (ejemplo: 30kg)

Zona Baja (Extensión):     0% - 33% de FM  →  0-10kg
Zona Media (Semi-arqueo):  33% - 66% de FM  →  10-20kg
Zona Alta (Arqueo):        66% - 100% de FM →  20-30kg
```

**Adaptación:**
- El sistema se adapta a cada usuario
- Se adapta a cada muelle del Gogor (diferentes durezas)
- Se recalibra en cada partida

---

## 💪 Tipos de Ejercicio

### 1. Isométrica 🔒
- **Acción:** Mantener fuerza constante
- **Sin movimiento** de apertura/cierre
- **Ejemplo:** "Mantén 20kg durante 10 segundos"
- **Beneficio:** Resistencia, control

### 2. Concéntrica ⬆️
- **Acción:** Apretar el dispositivo (aumentar fuerza)
- **Movimiento:** Cierre de dedos
- **Ejemplo:** "Sube de 0 a 25kg"
- **Beneficio:** Fuerza, potencia

### 3. Excéntrica ⬇️
- **Acción:** Soltar poco a poco (disminuir fuerza lentamente)
- **Movimiento:** Apertura controlada
- **Ejemplo:** "Baja de 25kg a 0kg en 15 segundos"
- **Beneficio:** **Estira articulaciones, previene artritis** ⭐

---

## 🎮 Modalidades de Juego

### 1. Calentamiento Rápido ⚡ (3 minutos)

**Objetivo:** Activación rápida antes de escalar

**Estructura:**
1. **Calibración** (15s)
2. **Fase 1 - Activación** (45s)
   - Isométrica zona baja
   - Movimientos suaves
3. **Fase 2 - Progresión** (90s)
   - Concéntrica gradual
   - Isométrica zona media
4. **Fase 3 - Preparación** (45s)
   - Excéntrica lenta
   - Isométrica zona alta

**Escenario:** Yosemite (amanecer)
**Sin ciclo noche** (muy corto)

---

### 2. Calentamiento Total 🔥 (5 minutos)

**Objetivo:** Calentamiento completo y profundo

**Estructura:**
1. **Calibración** (15s)
2. **Escenario 1: Yosemite** (2 min)
   - Activación zona baja (30s)
   - Progresión zona media (60s)
   - Zona alta (30s)
3. **Transición Noche** 🌙 (10s)
   - Descanso activo
   - Mensaje: "Respira profundo..."
4. **Escenario 2: Utah** (2.5 min)
   - Trabajo en zona media (60s)
   - Excéntricos lentos (60s)
   - Isométricos zona alta (30s)

**Escenarios:** Yosemite → Noche → Utah

---

### 3. Resistencia 💪 (3 vidas)

**Objetivo:** Fortalecimiento de dedos, desafío

**Mecánica:**
- Duración variable (hasta perder 3 vidas)
- La app te pide ejercicios aleatorios
- Debes completar cada ejercicio correctamente
- **Pierdes 1 vida si:**
  - Sales de la zona objetivo >3 segundos
  - No mantienes el tiempo requerido
  - Bajas muy rápido en excéntricos

**Estructura:**
1. **Calibración** (15s)
2. **Rotación ALEATORIA de escenarios** hasta perder 3 vidas:
   - Escenario aleatorio (Yosemite/Utah/Albarracín/Fontainebleau)
   - Ejercicios aleatorios durante 30-60s
   - Descanso 10s (transición noche)
   - Nuevo escenario aleatorio
   - Repite hasta perder 3 vidas

**Características:**
- Los 4 escenarios se eligen aleatoriamente
- Puede repetirse el mismo escenario consecutivamente
- Cada ronda de escenario dura ~30-60 segundos
- La dificultad aumenta progresivamente
- Ejercicios aleatorios en cada escenario

**Fin del juego:**
- Pierdes las 3 vidas
- No hay "victoria" definida (aguantas lo máximo posible)

---

## 📊 Métricas y Estadísticas

### Durante la partida (en tiempo real):
- Fuerza actual (kg)
- Zona actual (baja/media/alta)
- Tiempo restante
- Vidas restantes (modo Resistencia)
- Indicador visual de zona objetivo

### Al finalizar:
1. **Tiempo total dedicado**
2. **Fuerza promedio ejercida**
3. **Fuerza máxima alcanzada**
4. **Posición de mano predominante:**
   - % en Extensión (zona baja)
   - % en Semi-arqueo (zona media)
   - % en Arqueo (zona alta)
5. **Precisión:** % de tiempo dentro de zona objetivo
6. **Suavidad:** Variación de fuerza (menor = mejor)
7. **Puntuación final** (calculada según precisión + tiempo)

### Historial (futuro):
- Comparar con sesiones anteriores
- Progreso de fuerza máxima
- Gráficos de evolución

---

## 🎨 Elementos Visuales Clave

### Indicador de Fuerza
- **Número grande** mostrando kg actual
- **Barra visual** con 3 zonas coloreadas
- **Animación suave** (interpolación, no saltos)

### Indicador de Zona Objetivo
- **Zona resaltada** en la barra
- **Feedback visual** cuando estás dentro/fuera
- **Colores:**
  - Verde: Dentro de zona ✅
  - Amarillo: Cerca de zona ⚠️
  - Rojo: Fuera de zona ❌

### Escenario de Fondo
- **Ilustración estilo Monument Valley**
- **Parallax suave** (si hay tiempo)
- **Transiciones día/noche animadas**

### Cronómetro
- **Tiempo restante** en formato MM:SS
- **Cambio de color** cuando quedan <10s (naranja/rojo)

### Vidas (modo Resistencia)
- **3 corazones/iconos** en la parte superior
- **Animación de pérdida** cuando fallas

---

## 🔊 Diseño de Audio

### Música Ambient
- **Tracks generados con IA** estilo Brian Eno
- **Capas:**
  - Drones largos (base)
  - Texturas atmosféricas
  - Notas espaciadas (melodía mínima)
- **Variaciones por escenario:**
  - Yosemite: Tonos claros, etéreos
  - Utah: Tonos cálidos, resonantes
  - Albarracín: Tonos mediterráneos
  - Fontainebleau: Tonos verdes, orgánicos

### Efectos de Sonido
- **Feedback sutil** al entrar/salir de zona
- **Sonido suave** al completar ejercicio
- **Sonido de pérdida de vida** (modo Resistencia)
- **Sonido de victoria** al completar

### Sonidos Naturales (opcional)
- Viento suave
- Pájaros lejanos
- Agua (Fontainebleau)

---

## 🎯 Feedback Haptic

- **Entrada a zona objetivo:** Haptic ligero
- **Salida de zona:** Haptic medio
- **Completar ejercicio:** Haptic de éxito
- **Perder vida:** Haptic de error
- **Botones:** Haptic ligero al presionar

---

## 📱 Flujo de Navegación

```
1. Pantalla de Inicio
   ↓
2. Selección de Modo
   - Calentamiento Rápido (3 min)
   - Calentamiento Total (5 min)
   - Resistencia (3 vidas)
   ↓
3. Conexión Bluetooth
   - Buscar Tindeq/Force Board
   - Conectar
   ↓
4. Calibración
   - "Aprieta con fuerza máxima"
   - Detectar FM
   - Calcular zonas
   ↓
5. Juego
   - Ejercicios guiados
   - Feedback en tiempo real
   - Transiciones día/noche
   ↓
6. Resultados
   - Estadísticas
   - Puntuación
   - Opciones: Repetir / Volver
```

---

## 🛠️ Stack Tecnológico

### Frontend (App Móvil)
- **Framework:** React Native + Expo
- **Lenguaje:** TypeScript
- **Styling:** NativeWind (Tailwind CSS)
- **Navegación:** Expo Router
- **Animaciones:** React Native Reanimated

### Bluetooth
- **Librería:** react-native-ble-plx
- **Protocolo Tindeq:** Documentado en API oficial
- **Protocolo Force Board:** API pública de Pitchsix

### Generación de Assets
- **Ilustraciones:** IA (DALL-E/Midjourney style)
- **Música:** IA generativa (ambient/drone)

---

## 📦 Entregables

### Fase 1 (Prototipo funcional)
- ✅ App conecta con Tindeq
- ✅ Sistema de calibración funciona
- ✅ 3 modalidades de juego implementadas
- ✅ UI básica con escenarios
- ✅ Transiciones día/noche
- ✅ Estadísticas finales
- ✅ APK para Android

### Fase 2 (Pulido visual y sonoro)
- ⏳ Ilustraciones finales de los 4 escenarios
- ⏳ Música ambient generada
- ⏳ Animaciones pulidas
- ⏳ Efectos de sonido
- ⏳ Versión iOS

### Fase 3 (Funcionalidades avanzadas)
- ⏳ Soporte para Force Board
- ⏳ Historial de sesiones
- ⏳ Gráficos de progreso
- ⏳ Compartir resultados

---

## ⚠️ Notas Importantes

1. **Prioridad:** Funcionalidad > Estética (en el prototipo)
2. **Bluetooth:** Requiere Expo Development Build (no funciona en Expo Go)
3. **Testing:** Necesita dispositivo físico (Tindeq) para probar
4. **Calibración:** Es clave que funcione bien, todo depende de ella
5. **Excéntricos:** Son el ejercicio más importante (prevención artritis)

---

## 🎯 Criterios de Éxito

### Prototipo funcional:
- ✅ Se conecta al Tindeq sin problemas
- ✅ Calibración automática funciona correctamente
- ✅ Las 3 modalidades son jugables
- ✅ Detecta correctamente isométrica/concéntrica/excéntrica
- ✅ Feedback visual claro y útil
- ✅ Estadísticas finales precisas

### Experiencia de usuario:
- ✅ Interfaz intuitiva (no necesita tutorial)
- ✅ Sensación meditativa y relajante
- ✅ Motivación para calentar correctamente
- ✅ Útil para escaladores de todos los niveles

---

## 📅 Timeline Estimado

- **Fase 1 - Especificaciones:** ✅ Completado
- **Fase 2 - Assets visuales:** 2-3 horas
- **Fase 3 - Calibración y zonas:** 3-4 horas
- **Fase 4 - Bluetooth Tindeq:** 3-4 horas
- **Fase 5 - Modalidades de juego:** 4-5 horas
- **Fase 6 - UI y transiciones:** 3-4 horas
- **Fase 7 - Testing y APK:** 2-3 horas

**Total estimado:** 17-23 horas de desarrollo

---

## 🚀 Siguiente Paso

**Generar ilustraciones de los 4 escenarios** con IA (estilo Monument Valley)

