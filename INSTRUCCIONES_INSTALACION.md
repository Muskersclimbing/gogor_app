# Gogor Games - Instrucciones de Instalación

## ⚠️ IMPORTANTE: Por qué NO funciona con Expo Go

**Expo Go NO soporta Bluetooth**, que es necesario para conectar con el Tindeq Progressor. Por eso ves errores al intentar cargar la app.

Para usar esta app necesitas compilar un **Development Build** (APK personalizado).

---

## 📱 Opción 1: Compilar APK con EAS Build (Recomendado)

### Requisitos previos:
1. Cuenta de Expo (gratuita): https://expo.dev/signup
2. Instalar EAS CLI en tu ordenador:
   ```bash
   npm install -g eas-cli
   ```

### Pasos:

1. **Iniciar sesión en Expo:**
   ```bash
   cd /home/ubuntu/muskers_app
   eas login
   ```

2. **Configurar el proyecto:**
   ```bash
   eas build:configure
   ```

3. **Compilar APK para Android:**
   ```bash
   eas build --platform android --profile preview
   ```
   
   Este proceso tarda **15-20 minutos**. Expo compilará la app en sus servidores.

4. **Descargar el APK:**
   - Recibirás un enlace por email
   - O visita: https://expo.dev/accounts/[tu-usuario]/projects/muskers_app/builds
   - Descarga el archivo `.apk` en tu móvil Android

5. **Instalar en tu móvil:**
   - Abre el archivo `.apk` descargado
   - Android te pedirá permiso para instalar apps de fuentes desconocidas
   - Acepta e instala

---

## 🖥️ Opción 2: Compilar localmente (Avanzado)

### Requisitos:
- Android Studio instalado
- SDK de Android configurado
- Java JDK 17

### Pasos:

1. **Instalar dependencias:**
   ```bash
   cd /home/ubuntu/muskers_app
   pnpm install
   ```

2. **Generar Development Build:**
   ```bash
   npx expo run:android
   ```

3. **Conectar tu móvil por USB:**
   - Activa "Depuración USB" en tu Android
   - Conecta el cable USB
   - La app se instalará automáticamente

---

## 🎮 Cómo usar la app una vez instalada

### 1. Primera vez:
1. Abre "Gogor Games" en tu móvil
2. Toca "Comenzar"
3. Toca "Buscar dispositivos"
4. Enciende tu Tindeq Progressor
5. Selecciona "Progressor XXXX" de la lista
6. Espera a que se conecte (verás el indicador de batería)

### 2. Calibración:
1. Selecciona una modalidad:
   - **Calentamiento Rápido**: 3 minutos, 15 frutos
   - **Calentamiento Total**: 5 minutos, 25 frutos
   - **Resistencia**: Sin límite, 3 vidas
2. Sigue las instrucciones de calibración
3. Aprieta con fuerza máxima durante 5 segundos
4. Toca "Comenzar"

### 3. Jugar:
- **Aplica fuerza** para hacer subir el pájaro
- **Suelta** para que baje (gravedad)
- **Esquiva los obstáculos** (pilares marrones)
- **Recoge frutos** (círculos de colores)
- El pájaro cambia de color según tu zona de fuerza:
  - 🟢 Verde = zona baja (0-33%)
  - 🟡 Amarillo = zona media (33-66%)
  - 🔴 Rojo = zona alta (66-100%)

### 4. UI:
- **Top izquierda**: Frutos recogidos / objetivo
- **Top centro**: Indicador de progreso (fresas)
- **Top derecha**: Fuerza actual en tiempo real
- **Abajo izquierda**: Tiempo restante
- **Abajo derecha**: Botón STOP (detener juego)

---

## 🔧 Solución de problemas

### "No se encuentra el dispositivo Bluetooth"
- Asegúrate de que el Bluetooth está activado
- Enciende el Tindeq Progressor
- Dale permisos de Bluetooth a la app en Ajustes de Android

### "El pájaro sube/baja muy rápido"
- Avísame y ajustaré la sensibilidad de la física

### "Los obstáculos son muy difíciles"
- Avísame y ajustaré el tamaño del hueco o la velocidad

---

## 📝 Notas técnicas

- La app usa **colores de fondo** en lugar de fotos para mejor rendimiento
- Los frutos son **círculos de colores** (representan los 9 tipos de fruta)
- La música ambient se reproduce automáticamente durante el juego
- Los escenarios cambian de color según la zona:
  - Yosemite: Azul cielo
  - Monument Valley: Naranja desierto
  - Albarracín: Marrón tierra
  - Fontainebleau: Verde bosque

---

## ❓ ¿Necesitas ayuda?

Si tienes problemas con la compilación o instalación, avísame y te ayudo paso a paso.
