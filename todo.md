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
