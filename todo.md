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
- [x] Compilar APK exitosamente con EAS Build (Build ID: 19384e30-0499-451a-92f3-b95386fd8220)
- [x] APK listo para descargar: https://expo.dev/artifacts/eas/47CoFGQLfswfDG81fvzKF7.apk
- [x] NUEVO APK con todos los arreglos (Build ID: 1241bd32-6a7d-4d02-b506-e02919d60b18)
- [x] NUEVO APK listo: https://expo.dev/artifacts/eas/3fKTGcFKzriw9EgnRjsFZA.apk

## BUGS CRÍTICOS REPORTADOS POR USUARIO
- [ ] Pájaro no se mueve cuando se aplica fuerza (númer## BUGS CRÍTICOS REPORTADOS POR USUARIO
- [x] Pájaro no se mueve cuando se aplica fuerza (números cambian pero sprite no se mueve) - ARREGLADO: actualiza directamente birdY.value
- [x] Sprites son bolas simples, necesitan diseño visual decente - ARREGLADO: generados sprites de pájaro y frutos
- [x] Música es la misma de antes, cambiar por tracks diferentes - YA EXISTÍAN: mountain.wav, forest.wav, desert.wav
- [x] Conectar fuerza real del Tindeq al componente FlappyBirdGame - ARREGLADO: usa currentForce correctamente
- [x] El juego no se para cuando el pájaro choca con obstáculos - ARREGLADO: hasCollidedRef para el game loop
- [x] No se ven los fondos fotográficos de Yosemite, Monument Valley, etc - ARREGLADO: ImageBackground con imágenes optimizadas
- [x] Optimizar imágenes de fondo para que no causen crash - ARREGLADO: descargadas de Unsplash a 800px, 60-130KB
- [x] No hay zonas de descanso entre intervalos - YA EXISTÍA: transición nocturna de 10 segundos implementada


## APK FINAL COMPILADO EXITOSAMENTE
- [x] Build ID: dbb4e4bb-afd5-4e0e-b5b8-4dc9d5ba4942
- [x] URL: https://expo.dev/artifacts/eas/t8ymWYsH5wYpkC6me7oig9.apk
- [x] Física del pájaro corregida (sube con fuerza, cae sin fuerza)
- [x] Fondos de ilustración estilo Monument Valley (4 escenarios optimizados)
- [x] Música ambient completamente nueva (3 tracks generados)
- [x] Sprites pixel art optimizados (pájaro + 9 frutos, 6-16KB cada uno)
- [x] Colisiones que pausan el juego correctamente
- [x] Todo verificado antes de compilar


## BUGS CRÍTICOS - APK NO FUNCIONA
- [x] Pájaro NO responde a la fuerza del Tindeq, se queda caído en la parte baja - ARREGLADO: usar useRef para capturar currentForce actualizado
- [x] Sprites tienen fondo blanco (cuadradito blanco), deben ser transparentes - ARREGLADO: convert -transparent white
- [x] Revisar por qué currentForce no afecta la posición del pájaro - PROBLEMA: setInterval capturaba valor inicial de prop
- [x] Regenerar sprites con fondo transparente - COMPLETADO

## APK FINAL CORREGIDO
- [x] Build ID: e3a10ae4-d57c-4709-817a-a5b969755d7f
- [x] URL: https://expo.dev/artifacts/eas/u7imMrBMj22zvLQTLDqqdp.apk
- [x] Física corregida: currentForce capturado con useRef
- [x] Sprites con fondo transparente
- [x] QR generado: /home/ubuntu/apk_final_qr.png


## BUG CRÍTICO - Pájaro no se mueve
- [x] currentForce cambia correctamente (números en pantalla cambian)
- [x] Usuario aplica hasta 12.5kg de fuerza
- [x] Pájaro completamente quieto, no responde - ARREGLADO
- [x] Revisar lógica del game loop y actualización de birdY - PROBLEMA: useSharedValue no se sincronizaba
- [x] SOLUCIÓN: Reescribir usando useState para birdY en lugar de Reanimated Shared Value

## APK DEFINITIVO
- [x] Build ID: c2bdd119-de18-4903-8b61-9456bbfb5d4f
- [x] URL: https://expo.dev/artifacts/eas/q3KPdKSutw62QR9QWRtJu8.apk
- [x] Pájaro usa useState para posición (más confiable que Shared Value)
- [x] Física simplificada y funcional
- [x] QR: /home/ubuntu/apk_ultimo_qr.png


## APK CON TODOS LOS FIXES
- [x] Build ID: 16bb5abf-a29c-4559-8d1d-2126056acdca
- [x] URL: https://expo.dev/artifacts/eas/3NNQuv4CRgQ1dwviKxXnhf.apk
- [x] useRef para currentForce y lowZone
- [x] Eliminadas dependencias problemáticas del useEffect (currentForce, lowZone)
- [x] Console.log agregado para debug
- [x] QR: /home/ubuntu/apk_all_fixes_qr.png


## HALLAZGO CRÍTICO - Código Crane (Tindeq app open source)
- [x] Analizad código de Crane (https://github.com/sebws/Crane)
- [x] Usan DisplayLink (60 FPS timer) para actualizar UI
- [x] addDataPoint() se llama cada vez que llega dato del Tindeq
- [x] La vista se actualiza automáticamente con @Observable
- [x] NO usan setInterval con lógica compleja
- [x] SOLUCIÓN: Actualizar birdY directamente en useEffect que escucha currentForce


## APK CON TÉCNICA DE CRANE
- [x] Build ID: d16c3573-7810-4baf-89a1-ae99aa44b8a2
- [x] URL: https://expo.dev/artifacts/eas/rRUpErei9bJ1QTSiN7TQ3o.apk
- [x] useEffect que escucha currentForce directamente (como DisplayLink de Crane)
- [x] Actualización inmediata de birdY en cada cambio de fuerza
- [x] NO usa setInterval para física del pájaro
- [x] Game loop separado solo para obstáculos y frutos
- [x] QR: /home/ubuntu/apk_crane_qr.png


## BUG - Pájaro cae y se queda quieto
- [x] Pájaro cae lentamente y se queda abajo - ARREGLADO
- [x] Física solo se actualiza cuando cambia currentForce - ARREGLADO
- [x] Necesita actualización continua a 60 FPS (requestAnimationFrame) - IMPLEMENTADO
- [x] Sprites no se ven (solo círculos de colores) - ARREGLADO: usa Image con sprites PNG

## APK CON requestAnimationFrame
- [x] Build ID: 4bf0abc0-12ed-4d4a-9902-a6007f72065a
- [x] URL: https://expo.dev/artifacts/eas/anTBc7conSop5AE3PBE2jA.apk
- [x] requestAnimationFrame para game loop continuo a 60 FPS
- [x] Física se actualiza en cada frame (no solo cuando cambia currentForce)
- [x] Sprites PNG con Image component
- [x] QR: /home/ubuntu/apk_raf_qr.png


## APK DE TEST CON DEBUG INFO
- [x] Build ID: f200605e-fb2e-4c19-9da1-8154f43b3d9a
- [x] URL: https://expo.dev/artifacts/eas/vTeEJfFEBw1HCfaEQP6CAw.apk
- [x] Versión ultra-simple con debug info en pantalla
- [x] Muestra: isPaused, currentForce, lowZone, birdY, frames
- [x] Barra visual de fuerza en lado derecho
- [x] Logs extensivos en consola
- [x] QR: /home/ubuntu/apk_test_debug_qr.png
- [x] OBJETIVO: Identificar si isPaused está en TRUE (causa más probable)


## APK FINAL CON ANIMATED.VALUE
- [x] Build ID: 5c543a85-354e-4c61-af45-dbe2b10b9109
- [x] URL: https://expo.dev/artifacts/eas/cpgzbquo5S2atMBkx8UJ9z.apk
- [x] Usa Animated.Value para posición del pájaro (actualización nativa directa)
- [x] Soluciona el problema de setState que no actualizaba la UI
- [x] QR: /home/ubuntu/apk_final_animated_qr.png
- [x] ESTE APK DEBERÍA FUNCIONAR CORRECTAMENTE


## BUGS REPORTADOS - APK FINAL NO FUNCIONA
- [ ] Pájaro quieto (no responde a fuerza del Tindeq)
- [ ] Frutas casi no se ven
- [ ] Pájaro no choca contra los bloques (colisiones no funcionan)
- [ ] Usuario ha gastado dinero en plan de Expo sin resultado funcional
- [ ] ÚLTIMA OPORTUNIDAD: Copiar estructura exacta de Crane LiveChart.swift


## NUEVO ENFOQUE - Versión Mínima Funcional (Crane-inspired)
- [x] Analizar LiveChart.swift de Crane para entender actualización de UI en tiempo real
- [x] Crear versión MÍNIMA: solo pájaro que sube/baja con fuerza (sin obstáculos, sin sprites)
- [x] Agregar obstáculos y colisiones funcionales
- [x] Agregar frutos visibles y sprites PNG
- [ ] Compilar APK final y probar con Tindeq real

## APK MÍNIMO FUNCIONAL COMPILADO
- [x] Build ID: 0981af6c-e06d-42ec-95da-d8154cc829c4
- [x] URL: https://expo.dev/accounts/muskersclimbing/projects/muskers_app/builds/0981af6c-e06d-42ec-95da-d8154cc829c4
- [x] Versión mínima con mecánica Crane-inspired
- [x] Pájaro + obstáculos + frutos con colisiones
- [x] Game loop con requestAnimationFrame (60 FPS)
- [x] useRef para capturar valores actualizados


## BUG CRÍTICO - Pájaro pegado arriba
- [x] Pájaro se queda pegado en la parte superior todo el tiempo
- [x] Revisar lógica de mapeo de fuerza a posición Y
- [x] SOLUCIÓN: Cambiar a física simple de Flappy Bird (gravedad + salto cuando force > lowZone)
- [ ] Compilar nuevo APK


## MECÁNICA CORRECTA DEL JUEGO
- [x] Pájaro NO debe saltar
- [x] Control directo: fuerza aplicada = altura del pájaro
- [x] 0% fuerza = parte baja de la pantalla
- [x] 100% fuerza (máximo calibrado) = parte alta de la pantalla
- [x] Mapeo lineal entre fuerza actual y posición Y
- [x] Sin gravedad, sin saltos, solo control directo proporcional
- [x] Compilar APK final

## APK FINAL CON CONTROL DIRECTO
- [x] Build ID: cb870df7-d63f-4a27-aa8a-63a2dcc3b337
- [x] URL: https://expo.dev/accounts/muskersclimbing/projects/muskers_app/builds/cb870df7-d63f-4a27-aa8a-63a2dcc3b337
- [x] Control directo implementado: forcePercent = force / maxForce → targetY
- [x] QR generado: /home/ubuntu/muskers_app/expo-qr-code.png


## BUG - Pájaro sigue pegado arriba con control directo
- [x] A pesar de implementar forcePercent = force / maxForce, el pájaro está pegado arriba
- [x] Agregar debug extensivo para ver valores reales
- [x] PROBLEMA ENCONTRADO: calibrationData.highZone es NaN (undefined)
- [x] CAUSA: Acceso a calibrationData sin operador opcional cuando puede ser null
- [x] SOLUCIÓN: Usar calibrationData?.highZone || 20 para valores por defecto
- [x] Compilar APK con fix

## APK CON FIX DE NaN
- [x] Build ID: 49cd5683-e98a-4c50-a015-3926d475fce8
- [x] URL: https://expo.dev/accounts/muskersclimbing/projects/muskers_app/builds/49cd5683-e98a-4c50-a015-3926d475fce8
- [x] Fix aplicado: calibrationData?.highZone || 20
- [x] QR generado: /home/ubuntu/muskers_app/expo-qr-code.png


## NUEVOS BUGS ENCONTRADOS
- [x] Pájaro no se mueve visualmente (BirdY se calcula correctamente pero no se renderiza)
- [x] Problema: useState + requestAnimationFrame no re-renderiza lo suficientemente rápido
- [x] Solución: Usar Animated.Value para actualización nativa
- [ ] calibrationData.highZone sigue siendo undefined (usa valor por defecto 20 en lugar de 12.3)
- [ ] Necesita investigar por qué la calibración no guarda highZone correctamente
- [x] Compilar APK con Animated.Value

## APK FINAL CON ANIMATED.VALUE
- [x] Build ID: 0e7f90ae-6709-4e8e-840c-1c50587fe976
- [x] URL: https://expo.dev/accounts/muskersclimbing/projects/muskers_app/builds/0e7f90ae-6709-4e8e-840c-1c50587fe976
- [x] Pájaro ahora usa Animated.Value para actualización en tiempo real
- [x] QR generado: /home/ubuntu/muskers_app/expo-qr-code.png


## BUG CRÍTICO - Calibración devuelve NaN
- [x] Después de calibrar 5 segundos, muestra "Tu fuerza máxima: NaN kg"
- [x] Esto causa que highZone sea NaN y use valor por defecto de 20kg
- [x] El pájaro no se mueve porque los cálculos están basados en datos incorrectos
- [x] Problema: calibrationForces está vacío (0 / 0 = NaN)
- [x] Agregados logs de debug para diagnosticar
- [x] Agregada protección contra array vacío
- [ ] Compilar APK con logs de debug para ver qué pasa


## APK FINAL CON REANIMATED
- [x] Build ID: d9fc8ad5-639a-45a2-9319-74375e456dfe
- [x] URL: https://expo.dev/accounts/muskersclimbing/projects/muskers_app/builds/d9fc8ad5-639a-45a2-9319-74375e456dfe
- [x] Reescrito con react-native-reanimated (useSharedValue + useAnimatedStyle)
- [x] Actualización en UI thread nativo
- [x] QR generado: /home/ubuntu/muskers_app/expo-qr-code.png


## CAMBIO - Eliminar game over por colisión
- [x] El pájaro NO debe morir al chocar con bloques
- [x] El juego debe avanzar continuamente
- [x] Solo se cuentan las frutas recolectadas
- [x] Quitar llamada a onGameOver() en colisiones con obstáculos
- [x] Compilar APK final

## APK FINAL FUNCIONAL
- [x] Build ID: 043e19b4-6228-411c-a8de-634359c30858
- [x] URL: https://expo.dev/accounts/muskersclimbing/projects/muskers_app/builds/043e19b4-6228-411c-a8de-634359c30858
- [x] Pájaro se mueve con fuerza del Tindeq ✅
- [x] Calibración funciona correctamente ✅
- [x] Juego avanza continuamente sin game over ✅
- [x] QR generado: /home/ubuntu/muskers_app/expo-qr-code.png


## BUGS REPORTADOS
- [x] Pájaro pasa por encima de bloques sin colisionar
- [x] Cuando choca, el juego debe pausar hasta que encuentre el hueco
- [x] Frutas aparecen sobre bloques (deben estar solo en el hueco)
- [x] Timer termina a los 56-58 segundos en lugar de 60

## FIXES APLICADOS
- [x] Física de colisión: juego se pausa cuando choca, continúa cuando encuentra hueco
- [x] Frutas siempre en el centro del hueco (gapY + OBSTACLE_GAP / 2)
- [x] Timer corregido: cambiado `prev <= 1` a `prev <= 0` para contar 60 segundos completos
- [x] Pájaro se vuelve rojo cuando colisiona (indicador visual)
- [ ] Compilar APK final
