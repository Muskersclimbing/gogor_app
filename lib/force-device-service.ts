/**
 * Force Device Service - Soporte genérico para Tindeq y Force Board
 * 
 * Maneja la conexión y comunicación con dispositivos de fuerza via BLE.
 * Soporta:
 * - Tindeq Progressor
 * - Pitch Six Force Board
 * - Otros dispositivos de fuerza Bluetooth
 */

import { Platform } from 'react-native';

type Device = any;
type Characteristic = any;
type BleManagerType = any;

// UUIDs del Tindeq Progressor
const TINDEQ_SERVICE_UUID = '7e4e1701-1ea6-40c9-9dcc-13d34ffead57';
const TINDEQ_DATA_POINT_UUID = '7e4e1702-1ea6-40c9-9dcc-13d34ffead57';
const TINDEQ_CONTROL_POINT_UUID = '7e4e1703-1ea6-40c9-9dcc-13d34ffead57';

// UUIDs del Force Board (del PDF oficial Force Board Public API v1.0)
const FORCE_BOARD_DEVICE_MODE_UUID = '467a8517-6e39-11eb-9439-0242ac130002';
const FORCE_BOARD_FORCE_UUID = '9a88d683-8df2-4afe-9e0d-c2b8e773d00d';
const FORCE_BOARD_THRESHOLD_UUID = '9a88d683-8df2-4afe-9e0d-c2b8e773d00d';
const FORCE_BOARD_TARE_UUID = '9a88d683-8df2-4afe-9e0d-c2b8e773d00d';

// Comandos del Tindeq
const CMD_TARE = 0x64;
const CMD_START_MEASUREMENT = 0x65;
const CMD_STOP_MEASUREMENT = 0x66;
const CMD_SHUTDOWN = 0x6e;
const CMD_BATTERY = 0x6f;

// Response codes del Tindeq
const RESP_BATTERY = 0x00;
const RESP_WEIGHT = 0x01;
const RESP_LOW_BATTERY = 0x04;

// Modos del Force Board
const FORCE_BOARD_IDLE_MODE = 0x07;
const FORCE_BOARD_STREAMING_MODE = 0x04;
const FORCE_BOARD_QUICK_START_MODE = 0x06;

export interface ForceData {
  weight: number; // kg
  timestamp: number; // microseconds (Tindeq) o 0 (Force Board)
}

export interface CalibrationData {
  maxForce: number; // kg
  lowZone: number; // 0-33%
  mediumZone: number; // 33-66%
  highZone: number; // 66-100%
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'tindeq' | 'force_board';
}

type ForceCallback = (data: ForceData) => void;
type BatteryCallback = (voltage: number) => void;
type ConnectionCallback = (connected: boolean) => void;

class ForceDeviceService {
  private manager: BleManagerType | null = null;
  private device: Device | null = null;
  private deviceType: 'tindeq' | 'force_board' | null = null;
  private forceCallback: ForceCallback | null = null;
  private batteryCallback: BatteryCallback | null = null;
  private connectionCallback: ConnectionCallback | null = null;
  private isScanning = false;
  private isConnected = false;

  constructor() {
    // No inicializar BleManager en el constructor
  }

  /**
   * Inicializar BleManager de forma lazy
   */
  private initializeManager(): void {
    if (this.manager) {
      return;
    }

    if (Platform.OS === 'web') {
      throw new Error('Bluetooth no disponible en web');
    }

    try {
      const { BleManager } = require('react-native-ble-plx');
      this.manager = new BleManager();
    } catch (error) {
      console.error('Error inicializando BleManager:', error);
      throw new Error('No se pudo inicializar el gestor de Bluetooth');
    }
  }

  /**
   * Detectar tipo de dispositivo por nombre
   */
  private detectDeviceType(deviceName: string): 'tindeq' | 'force_board' | 'unknown' {
    const name = deviceName?.toLowerCase() || '';
    
    if (name.includes('progressor')) {
      return 'tindeq';
    }
    
    if (name.includes('force')) {
      return 'force_board';
    }
    
    return 'unknown';
  }

  /**
   * Escanear dispositivos de fuerza cercanos
   */
  async scanForDevices(onDeviceFound: (device: DeviceInfo) => void): Promise<void> {
    try {
      this.initializeManager();

      if (!this.manager) {
        throw new Error('Bluetooth no disponible en esta plataforma');
      }

      if (this.isScanning) {
        return;
      }

      this.isScanning = true;

      if (Platform.OS === 'android') {
        try {
          const state = await this.manager.state();
          if (state !== 'PoweredOn') {
            throw new Error('Bluetooth no está encendido');
          }
        } catch (stateError) {
          console.error('Error verificando estado de Bluetooth:', stateError);
          this.isScanning = false;
          throw stateError;
        }
      }

      try {
        // Escanear sin filtros para detectar cualquier dispositivo
        this.manager.startDeviceScan(
          null,
          { allowDuplicates: false },
          (error: any, device: Device) => {
            try {
              if (error) {
                console.error('Error escaneando:', error);
                this.isScanning = false;
                return;
              }

              if (device && device.name) {
                const deviceType = this.detectDeviceType(device.name);
                
                // Reportar dispositivos conocidos
                if (deviceType !== 'unknown') {
                  onDeviceFound({
                    id: device.id,
                    name: device.name,
                    type: deviceType,
                  });
                }
              }
            } catch (callbackError) {
              console.error('Error en callback de escaneo:', callbackError);
              this.isScanning = false;
            }
          }
        );
      } catch (scanError) {
        console.error('Error iniciando escaneo:', scanError);
        this.isScanning = false;
        throw scanError;
      }
    } catch (error) {
      console.error('Error en scanForDevices:', error);
      this.isScanning = false;
      throw error;
    }
  }

  /**
   * Detener escaneo
   */
  stopScan(): void {
    if (this.manager) {
      this.manager.stopDeviceScan();
    }
    this.isScanning = false;
  }

  /**
   * Conectar a un dispositivo de fuerza
   */
  async connect(deviceId: string, deviceType: 'tindeq' | 'force_board'): Promise<void> {
    this.initializeManager();

    if (!this.manager) {
      throw new Error('Bluetooth no disponible en esta plataforma');
    }

    try {
      this.stopScan();

      console.log('[FORCE] Conectando a dispositivo:', deviceId, 'tipo:', deviceType);
      this.device = await this.manager.connectToDevice(deviceId);
      this.deviceType = deviceType;
      console.log('[FORCE] Dispositivo conectado:', this.device?.id);

      console.log('[FORCE] Descubriendo servicios...');
      try {
        await this.device.discoverAllServicesAndCharacteristics();
        console.log('[FORCE] Servicios descubiertos exitosamente');
      } catch (discoverError) {
        console.warn('[FORCE] Error descubriendo servicios (continuando de todas formas):', discoverError);
      }

      this.isConnected = true;
      this.connectionCallback?.(true);
      console.log('[FORCE] Conexión establecida');

      this.device.onDisconnected(() => {
        console.log('[FORCE] Dispositivo desconectado');
        this.isConnected = false;
        this.device = null;
        this.deviceType = null;
        this.connectionCallback?.(false);
      });

      if (deviceType === 'tindeq') {
        console.log('[FORCE] Suscribiendo a Tindeq Data Point...');
        await this.subscribeTindeqDataPoint();
      } else if (deviceType === 'force_board') {
        console.log('[FORCE] Suscribiendo a Force Board Force Characteristic...');
        await this.subscribeForceBoard();
      }

      console.log('[FORCE] Suscripción completada');
    } catch (error) {
      console.error('[FORCE] Error conectando:', error);
      this.isConnected = false;
      this.device = null;
      this.deviceType = null;
      throw error;
    }
  }

  /**
   * Desconectar del dispositivo
   */
  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        if (this.deviceType === 'tindeq') {
          await this.stopMeasurement();
        } else if (this.deviceType === 'force_board') {
          await this.setForceBoardMode(FORCE_BOARD_IDLE_MODE);
        }
      } catch (error) {
        console.error('[FORCE] Error deteniendo medición:', error);
      }

      await this.device.cancelConnection();
      this.device = null;
      this.isConnected = false;
      this.deviceType = null;
      this.connectionCallback?.(false);
    }
  }

  /**
   * Verificar si está conectado
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Obtener tipo de dispositivo conectado
   */
  getDeviceType(): 'tindeq' | 'force_board' | null {
    return this.deviceType;
  }

  /**
   * Suscribirse al Data Point del Tindeq
   */
  private async subscribeTindeqDataPoint(): Promise<void> {
    if (!this.device) {
      throw new Error('No hay dispositivo conectado');
    }

    await this.device.monitorCharacteristicForService(
      TINDEQ_SERVICE_UUID,
      TINDEQ_DATA_POINT_UUID,
      (error: any, characteristic: Characteristic) => {
        if (error) {
          console.error('[FORCE] Error monitoreando Tindeq Data Point:', error);
          return;
        }

        if (characteristic?.value) {
          this.handleTindeqDataPointNotification(characteristic);
        }
      }
    );
  }

  /**
   * Suscribirse a Force Board
   */
  private async subscribeForceBoard(): Promise<void> {
    if (!this.device) {
      throw new Error('No hay dispositivo conectado');
    }

    // Primero, establecer modo Streaming
    await this.setForceBoardMode(FORCE_BOARD_STREAMING_MODE);

    // Luego suscribirse a Force Characteristic
    try {
      await this.device.monitorCharacteristicForService(
        FORCE_BOARD_FORCE_UUID,
        FORCE_BOARD_FORCE_UUID,
        (error: any, characteristic: Characteristic) => {
          if (error) {
            console.error('[FORCE] Error monitoreando Force Board:', error);
            return;
          }

          if (characteristic?.value) {
            this.handleForceBoardNotification(characteristic);
          }
        }
      );
    } catch (error) {
      console.error('[FORCE] Error suscribiendo a Force Board:', error);
      // Intentar con monitorCharacteristicForService sin UUID de servicio
      await this.device.monitorCharacteristicForService(
        FORCE_BOARD_FORCE_UUID,
        FORCE_BOARD_FORCE_UUID,
        (error: any, characteristic: Characteristic) => {
          if (error) {
            console.error('[FORCE] Error monitoreando Force Board (intento 2):', error);
            return;
          }

          if (characteristic?.value) {
            this.handleForceBoardNotification(characteristic);
          }
        }
      );
    }
  }

  /**
   * Procesar notificaciones del Tindeq
   */
  private handleTindeqDataPointNotification(characteristic: Characteristic): void {
    const data = this.base64ToBytes(characteristic.value!);

    if (data.length < 2) {
      return;
    }

    const responseCode = data[0];
    const length = data[1];

    switch (responseCode) {
      case RESP_WEIGHT:
        for (let i = 2; i < data.length; i += 8) {
          if (i + 8 <= data.length) {
            const weight = this.bytesToFloat32(data.slice(i, i + 4));
            const timestamp = this.bytesToUint32(data.slice(i + 4, i + 8));

            this.forceCallback?.({
              weight,
              timestamp,
            });
          }
        }
        break;

      case RESP_BATTERY:
        if (data.length >= 6) {
          const voltage = this.bytesToUint32(data.slice(2, 6));
          this.batteryCallback?.(voltage);
        }
        break;

      case RESP_LOW_BATTERY:
        console.warn('[FORCE] Batería baja del Tindeq');
        break;
    }
  }

  /**
   * Procesar notificaciones del Force Board
   */
  private handleForceBoardNotification(characteristic: Characteristic): void {
    try {
      // El Force Board envía datos en formato de entero (lbs)
      const data = this.base64ToBytes(characteristic.value!);

      if (data.length < 2) {
        return;
      }

      // Leer como integer little-endian (2 bytes)
      const forceLbs = this.bytesToInt16(data.slice(0, 2));
      
      // Convertir de lbs a kg
      const forceKg = forceLbs * 0.453592;

      this.forceCallback?.({
        weight: forceKg,
        timestamp: 0, // Force Board no proporciona timestamp
      });
    } catch (error) {
      console.error('[FORCE] Error procesando Force Board notification:', error);
    }
  }

  /**
   * Establecer modo del Force Board
   */
  private async setForceBoardMode(mode: number): Promise<void> {
    if (!this.device) {
      throw new Error('No hay dispositivo conectado');
    }

    try {
      const modeBytes = new Uint8Array([mode]);
      const base64Mode = this.bytesToBase64(modeBytes);

      await this.device.writeCharacteristicWithResponseForService(
        FORCE_BOARD_DEVICE_MODE_UUID,
        FORCE_BOARD_DEVICE_MODE_UUID,
        base64Mode
      );

      console.log('[FORCE] Modo Force Board establecido a:', mode);
    } catch (error) {
      console.error('[FORCE] Error estableciendo modo Force Board:', error);
      throw error;
    }
  }

  /**
   * Enviar comando al Tindeq
   */
  private async sendTindeqCommand(opcode: number, value?: Uint8Array): Promise<void> {
    if (!this.device) {
      throw new Error('No hay dispositivo conectado');
    }

    const length = value ? value.length : 0;
    const command = new Uint8Array(2 + length);
    command[0] = opcode;
    command[1] = length;

    if (value) {
      command.set(value, 2);
    }

    const base64Command = this.bytesToBase64(command);

    await this.device.writeCharacteristicWithResponseForService(
      TINDEQ_SERVICE_UUID,
      TINDEQ_CONTROL_POINT_UUID,
      base64Command
    );
  }

  /**
   * Calibrar (TARE) - establecer cero cuando no hay carga
   */
  async tare(): Promise<void> {
    if (this.deviceType === 'tindeq') {
      await this.sendTindeqCommand(CMD_TARE);
    } else if (this.deviceType === 'force_board') {
      // Force Board: escribir 0x01 en característica Tare para calibrar
      try {
        const tareByte = Buffer.from([0x01]).toString('base64');
        await this.device.writeCharacteristicWithResponseForService(
          this.device.serviceUUIDs?.[0] || FORCE_BOARD_DEVICE_MODE_UUID,
          FORCE_BOARD_TARE_UUID,
          tareByte
        );
        console.log('[FORCE] Tare del Force Board enviado');
      } catch (error) {
        console.error('[FORCE] Error al hacer tare del Force Board:', error);
        throw error;
      }
    }
  }

  /**
   * Iniciar medición de fuerza
   */
  async startMeasurement(): Promise<void> {
    if (this.deviceType === 'tindeq') {
      await this.sendTindeqCommand(CMD_START_MEASUREMENT);
    } else if (this.deviceType === 'force_board') {
      await this.setForceBoardMode(FORCE_BOARD_STREAMING_MODE);
    }
  }

  /**
   * Detener medición de fuerza
   */
  async stopMeasurement(): Promise<void> {
    if (this.deviceType === 'tindeq') {
      await this.sendTindeqCommand(CMD_STOP_MEASUREMENT);
    } else if (this.deviceType === 'force_board') {
      await this.setForceBoardMode(FORCE_BOARD_IDLE_MODE);
    }
  }

  /**
   * Apagar el dispositivo (solo Tindeq)
   */
  async shutdown(): Promise<void> {
    if (this.deviceType === 'tindeq') {
      await this.sendTindeqCommand(CMD_SHUTDOWN);
    }
  }

  /**
   * Leer voltaje de batería (solo Tindeq)
   */
  async readBattery(): Promise<void> {
    if (this.deviceType === 'tindeq') {
      await this.sendTindeqCommand(CMD_BATTERY);
    }
  }

  /**
   * Registrar callback para datos de fuerza
   */
  onForceData(callback: ForceCallback): void {
    this.forceCallback = callback;
  }

  /**
   * Registrar callback para batería
   */
  onBatteryData(callback: BatteryCallback): void {
    this.batteryCallback = callback;
  }

  /**
   * Registrar callback para cambios de conexión
   */
  onConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallback = callback;
  }

  // Utilidades de conversión de bytes

  private base64ToBytes(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private bytesToFloat32(bytes: Uint8Array): number {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    for (let i = 0; i < 4; i++) {
      view.setUint8(i, bytes[i]);
    }
    return view.getFloat32(0, true);
  }

  private bytesToUint32(bytes: Uint8Array): number {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    for (let i = 0; i < 4; i++) {
      view.setUint8(i, bytes[i]);
    }
    return view.getUint32(0, true);
  }

  private bytesToInt16(bytes: Uint8Array): number {
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    for (let i = 0; i < 2; i++) {
      view.setUint8(i, bytes[i]);
    }
    return view.getInt16(0, true);
  }
}

// Singleton instance
export const forceDeviceService = new ForceDeviceService();
