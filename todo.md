# TODO - Gogor Games

## Fase 1: Documentar especificaciones completas del juego
- [x] Revisar toda la conversación inicial
- [x] Crear documento maestro de especificaciones (GOGOR_GAMES_SPECS.md)
- [x] Definir mecánicas de juego (isométrica, concéntrica, excéntrica)
- [x] Definir 3 modalidades (Rápido 3min, Total 5min, Resistencia 3 vidas)
- [x] Definir sistema de calibración automática
- [x] Definir escenarios (Yosemite, Utah, Albarracín, Fontainebleau)
- [x] Definir ciclo día/noche
- [x] Definir métricas y estadísticas

## Fase 2: Generar assets visuales (ilustraciones de escenarios)
- [x] Generar ilustración de Yosemite (estilo Monument Valley)
- [x] Generar ilustración de Utah (estilo Monument Valley)
- [x] Generar ilustración de Albarracín (estilo Monument Valley)
- [x] Generar ilustración de Fontainebleau (estilo Monument Valley)
- [x] Generar variantes día/noche de cada escenario
- [ ] Optimizar imágenes para móvil

## Fase 3: Implementar sistema de calibración y zonas de fuerza
- [x] Crear componente de calibración inicial
- [x] Implementar detección de fuerza máxima sostenida
- [x] Calcular automáticamente 3 zonas (baja 0-33%, media 33-66%, alta 66-100%)
- [ ] Crear sistema de detección de tipo de ejercicio (isométrica/concéntrica/excéntrica)
- [ ] Implementar validación de ejercicios

## Fase 4: Implementar conexión Bluetooth con Tindeq
- [x] Implementar búsqueda de dispositivos Bluetooth
- [x] Implementar conexión con Tindeq Progressor
- [x] Implementar lectura de datos de fuerza en tiempo real
- [x] Implementar comando TARE para calibrar
- [x] Mostrar estado de conexión y nivel de batería
- [x] Manejar desconexiones y reconexiones

## Fase 5: Implementar las 3 modalidades de juego
- [ ] Implementar Calentamiento Rápido (3 min, 1 escenario)
- [ ] Implementar Calentamiento Total (5 min, 2 escenarios + noche)
- [ ] Implementar Resistencia (3 vidas, 4 escenarios + noches)
- [ ] Implementar lógica de pérdida de vidas
- [ ] Implementar sistema de ejercicios aleatorios (modo Resistencia)
- [ ] Implementar cronómetro y temporizadores
- [ ] Implementar cálculo de puntuación

## Fase 6: Implementar UI con escenarios y transiciones día/noche
- [ ] Actualizar pantalla de inicio con selección de modalidad
- [ ] Crear pantalla de calibración con instrucciones visuales
- [ ] Actualizar pantalla de juego con:
  - [ ] Fondo de escenario (ilustraciones)
  - [ ] Indicador de fuerza grande con zonas coloreadas
  - [ ] Indicador de zona objetivo
  - [ ] Cronómetro con cambio de color
  - [ ] Vidas (modo Resistencia)
  - [ ] Instrucciones de ejercicio actual
- [ ] Implementar transiciones día/noche animadas
- [ ] Implementar cambio de escenarios
- [ ] Actualizar pantalla de resultados con estadísticas completas
- [ ] Implementar feedback haptic
- [ ] Añadir música ambient (si hay tiempo)

## Fase 7: Generar APK y entregar prototipo funcional
- [ ] Compilar Expo Development Build
- [ ] Probar en dispositivo Android con Tindeq real
- [ ] Ajustar calibración según pruebas
- [ ] Generar APK final
- [ ] Documentar cómo instalar y usar
- [ ] Entregar al usuario para testing

## Backlog (Futuro)
- [ ] Soporte para Force Board de Pitchsix
- [ ] Historial de sesiones
- [ ] Gráficos de progreso
- [ ] Compartir resultados
- [ ] Versión iOS
- [ ] Música ambient generada con IA
- [ ] Efectos de sonido
- [ ] Animaciones avanzadas (parallax)


## BUGS REPORTADOS (Urgente)
- [x] Corregir error "Cannot read property 'createClient' of null" en dispositivo móvil
- [x] Cambiar nombre de app de "El Vuelo del Cuervo" a "Gogor Games"
- [x] Corregir error "Unmatched Route" en navegación

- [x] Corregir error de permisos de Bluetooth en Android (requiere Development Build)

## Fase 5+6: Implementar modalidades y escenarios (En progreso)
- [x] Crear pantalla de selección de modalidad
- [x] Implementar lógica de Calentamiento Rápido (3min, 1 escenario)
- [x] Implementar lógica de Calentamiento Total (5min, 2 escenarios)
- [x] Implementar lógica de Resistencia (3 vidas, escenarios aleatorios)
- [x] Integrar ilustraciones como fondos de pantalla
- [x] Implementar transiciones día/noche
- [x] Actualizar pantalla de resultados con estadísticas


## REDISEÑO COMPLETO DEL JUEGO (Nueva Especificación)

### Mecánica Core
- [x] Implementar mecánica Flappy Bird (fuerza Tindeq = altura del pájaro)
- [x] Pájaro sube cuando aplicas fuerza, baja por gravedad
- [x] Obstáculos geométricos (pilares) que el pájaro debe esquivar
- [x] Sistema de colisiones (pájaro vs obstáculos, pájaro vs suelo/techo)

### Sistema de Frutos
- [x] Implementar sistema de recolección de frutos pixel art
- [x] 9 tipos de frutos: sandía, plátano, manzana, naranja, fresa, mandarina, cereza, pera, melocotón
- [ ] Frutos aparecen en posiciones según tipo de ejercicio:
  - Isométrico: horizontal en lo alto
  - Excéntrico: diagonal descendente
  - Concéntrico: intercalados arriba y abajo
- [x] Contador de frutos: X/25 (Calentamiento 3min y 5min)
- [x] Modo Resistencia: máximo de frutos posible
- [ ] Indicador visual de progreso (fresas pixel art en top center)

### Estética y Assets
- [x] Descargar fondos fotográficos reales de:
  - Yosemite
  - Fontainebleau
  - Albarracín
  - Monument Valley
- [ ] Fondos rotan cada intervalo (no uno por modalidad)
- [x] Transición a noche entre intervalos (10 seg descanso)
- [x] Crear/descargar sprites de frutos pixel art (9 tipos)
- [x] Diseñar pájaro geométrico minimal (no realista)
- [ ] Pájaro debe tener animación de aleteo sutil
- [x] Obstáculos geométricos simples (pilares, rectángulos)

### UI Layout (según imagen del usuario)
- [x] Top left: Contador frutos (5/25) - fuente grande, color tierra
- [x] Top center: 4 fresas pixel art mostrando progreso visual
- [x] Top right: Fuerza actual (5.1Kg) - fuente grande, tiempo real
- [x] Bottom left: Tiempo restante (2:35) - fuente grande
- [x] Bottom right: Botón STOP circular
- [x] Centro: Área de juego (pájaro, obstáculos, frutos, fondo)
- [x] Reducir drasticamente el espacio del panel de números
- [x] Protagonismo visual al pájaro y el recorrido

### Música y Audio
- [x] Descargar música ambient estilo Brian Eno / Boards of Canada
- [x] Música debe ser atmosférica, no dramática/cinemática
- [x] Música de fondo continua durante el juego
- [ ] Efectos de sonido sutiles al recoger frutos (opcional)

### Física y Animación
- [x] Implementar física realista de Flappy Bird
- [x] Gravedad constante
- [x] Impulso hacia arriba proporcional a la fuerza aplicada
- [x] Rotación del pájaro según velocidad vertical
- [ ] Animación de aleteo del pájaro
- [ ] Parallax suave del fondo (opcional)
- [ ] Partículas reposicionadas alrededor del pájaro (no sobre botón)

### Sistema de Intervalos y Descansos
- [ ] Cada intervalo = nuevo fondo fotográfico
- [ ] Entre intervalos: 10 seg descanso con transición a noche
- [ ] Durante descanso: pájaro desaparece, mensaje "Descansa"
- [ ] Fondos rotan: Yosemite → Fontainebleau → Albarracín → Monument Valley → repite
- [ ] Cronómetro sigue corriendo durante descansos
### Correcciones Críticas

- [x] Pájaro DEBE cambiar de color según zona de fuerza (verde/amarillo/rojo)
- [x] Pájaro DEBE moverse verticalmente según fuerza aplicada
- [ ] Partículas DEBEN estar alrededor del pájaro, no sobre botones
- [x] Música DEBE ser ambient, no cinemática
- [x] UI DEBE ser minimalista, protagonismo al juego

## BUG URGENTE - Error en Expo Go
- [x] Diagnosticar error "Something went wrong" en pantalla azul al cargar app en Expo Go
- [x] Revisar imports y dependencias que puedan estar causando el error
- [x] Verificar que todos los assets (imágenes, música) existan y estén correctamente referenciados
- [x] Solución: Reemplazar ImageBackground con View + colores sólidos (imágenes JPG grandes causaban crash en Expo Go)
- [ ] Probar que la app carga correctamente en Expo Go

## PROBLEMA IDENTIFICADO - Expo Go no soporta Bluetooth
- [x] Identificar que Expo Go no puede usar react-native-ble-plx (Bluetooth)
- [x] Confirmar que se necesita Expo Development Build
- [x] Documentar proceso de compilación con EAS Build
- [x] Proporcionar instrucciones claras al usuario (ver INSTRUCCIONES_INSTALACION.md)
