# Tindeq Progressor API - Notas Técnicas

## Bluetooth GATT Services y Characteristics

### Service Principal
- **UUID:** `7e4e1701-1ea6-40c9-9dcc-13d34ffead57`

### Características:

1. **Data Point (Recibir datos)**
   - **UUID:** `7e4e1702-1ea6-40c9-9dcc-13d34ffead57`
   - **Propiedades:** Notify
   - **Uso:** Aquí recibimos los datos de fuerza del Tindeq
   - **Importante:** Hay que habilitar notificaciones primero

2. **Control Point (Enviar comandos)**
   - **UUID:** `7e4e1703-1ea6-40c9-9dcc-13d34ffead57`
   - **Propiedades:** Write, Write without response
   - **Uso:** Aquí enviamos comandos al Tindeq

## Formato de Datos

- **Formato:** TLV (Tag-Length-Value)
- **Endianness:** Little endian (byte menos significativo primero)

## Comandos Principales

Necesito hacer scroll en la página para ver los comandos específicos (TARE, Start Measurement, etc.)

## Notas Importantes

- **Auto-shutdown:** El Tindeq se apaga automáticamente después de 10 minutos de inactividad
- **Conexión:** No requiere pairing previo
- **Activación:** Presionar el botón pequeño para despertar el dispositivo

## Próximos pasos

1. Hacer scroll en la documentación para ver comandos específicos
2. Implementar la conexión BLE en React Native
3. Implementar comandos TARE y Start/Stop measurement


## Comandos Disponibles

### Formato de Comando
- **Estructura:** Opcode(1 byte) + Length(1 byte) + Value(n bytes)

### Comandos Principales:

| Opcode | Procedimiento | Descripción | Parámetros |
|--------|---------------|-------------|------------|
| `0x64` | **Tare scale** | Calibrar a cero cuando no hay carga aplicada | None |
| `0x65` | **Start weight measurement** | Iniciar medición continua. Sample rate: 80 Hz | None |
| `0x66` | **Stop weight measurement** | Detener medición. Hacer esto antes de leer batería | None |
| `0x6E` | **Shutdown** | Apagar el Progressor | None |

### Comandos Clave para Gogor Games:

1. **TARE (0x64):** Calibrar antes de cada ejercicio
2. **Start Measurement (0x65):** Iniciar lectura de fuerza (80 Hz = 80 lecturas/segundo)
3. **Stop Measurement (0x66):** Detener lectura



## Data Point - Respuestas Recibidas

### Formato de Respuesta
- **Estructura:** Response code(1 byte) + Length(1 byte) + Value(n bytes)

### Response Codes:

| Response Code | Descripción | Parámetros |
|---------------|-------------|------------|
| `0x00` | Respuesta a "Sample battery voltage" | Battery voltage en milivolts (uint32_t) |
| `0x01` | **Weight measurement** | Weight (float32), Timestamp (uint32_t) |
| `0x04` | Low power warning | None (batería vacía, se apagará) |

### Datos de Fuerza (Response Code 0x01):

**Formato:**
- **Weight:** float32 (4 bytes) - Fuerza en kg
- **Timestamp:** uint32_t (4 bytes) - Microsegundos desde que empezó la medición

**Importante:**
- Sample rate: **80 Hz** (80 mediciones por segundo)
- Datos en **little endian**

### Comando de Batería (0x6F):
- Mide el voltaje de batería en milivolts
- Útil para mostrar nivel de batería en la UI

