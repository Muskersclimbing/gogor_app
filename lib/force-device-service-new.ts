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

// UUIDs del Force Board
const FORCE_BOARD_DEVICE_MODE_UUID = '46748517-6e39-11eb-9439-0242ac130002';
const FORCE_BOARD_FORCE_UUID = '9a88d682-8df2-4aff-9e0d-c2bbe773d00d';
const FORCE_BOARD_THRESHOLD_UUID = '9a88d686-8df2-4aff-9e0d-c2bbe773d00d';

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
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'tindeq' | 'force_board';
}

class ForceDeviceService {
  private static instance: ForceDeviceService;
  private manager: BleManagerType | null = null;
  private device: Device | null = null;
  private deviceType: 'tindeq' | 'force_board' | null = null;
  private isConnected = false;
  private isScanning = false;
  private onDataCallback: ((data: ForceData) => void) | null = null;
  private connectionCallback: ((connected: boolean) => void) | null = null;
  private devicesCallback: ((devices: DeviceInfo[]) => void) | null = null;
  private scannedDevices: Map<string, DeviceInfo> = new Map();

  private constructor() {}

  static getInstance(): ForceDeviceService {
    if (!ForceDeviceService.instance) {
      ForceDeviceService.instance = new ForceDeviceService();
    }
    return ForceDeviceService.instance;
  }

  /**
   * Inicializar el manager de Bluetooth
   */
  private initializeManager(): void {
    if (this.manager) return;

    if (Platform.OS === 'web') {
      console.warn('[FORCE] Bluetooth no disponible en web');
      return;
    }

    try {
      const { BleManager } = require('react-native-ble-plx');
      this.manager = new BleManager();
      console.log('[FORCE] BleManager inicializado');
    } catch (error) {
      console.error('[FORCE] Error inicializando BleManager:', error);
    }
  }

  /**
   * Registrar callback para datos de fuerza
   */
  onData(callback: (data: ForceData) => void): void {
    this.onDataCallback = callback;
  }

  /**
   * Registrar callback para cambios de conexión
   */
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallback = callback;
  }

  /**
   * Registrar callback para dispositivos encontrados
   */
  onDevicesFound(callback: (devices: DeviceInfo[]) => void): void {
    this.devicesCallback = callback;
  }

  /**
   * Escanear dispositivos Bluetooth
   */
  async scan(): Promise<void> {
    this.initializeManager();

    if (!this.manager) {
      throw new Error('Bluetooth no disponible en esta plataforma');
    }

    try {
      this.isScanning = true;
      this.scannedDevices.clear();

      console.log('[FORCE] Iniciando escaneo...');

      this.manager.startDeviceScan(null, null, (error: any, device: Device) => {
        if (error) {
          console.error('[FORCE] Error en escaneo:', error);
          return;
        }

        if (device) {
          const deviceType = this.detectDeviceType(device.name);

          if (deviceType) {
            const deviceInfo: DeviceInfo = {
              id: device.id,
              name: device.name || 'Dispositivo desconocido',
              type: deviceType,
            };

            if (!this.scannedDevices.has(device.id)) {
              this.scannedDevices.set(device.id, deviceInfo);
              console.log('[FORCE] Dispositivo encontrado:', deviceInfo.name, '(' + deviceInfo.type + ')');
              this.devicesCallback?.(Array.from(this.scannedDevices.values()));
            }
          }
        }
      });
    } catch (error) {
      console.error('[FORCE] Error iniciando escaneo:', error);
      this.isScanning = false;
      throw error;
    }
  }

  /**
   * Detener escaneo
   */
  stopScan(): void {
    if (this.manager && this.isScanning) {
      this.manager.stopDeviceScan();
      this.isScanning = false;
      console.log('[FORCE] Escaneo detenido');
    }
  }

  /**
   * Detectar tipo de dispositivo por nombre
   */
  private detectDeviceType(name?: string): 'tindeq' | 'force_board' | null {
    if (!name) return null;

    const lowerName = name.toLowerCase();

    if (lowerName.includes('tindeq')) {
      return 'tindeq';
    }

    if (lowerName.includes('force')) {
      return 'force_board';
    }

    return null;
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
        await this.device.cancelConnection();
        this.isConnected = false;
        this.device = null;
        this.deviceType = null;
        console.log('[FORCE] Desconectado');
      } catch (error) {
        console.error('[FORCE] Error desconectando:', error);
      }
    }
  }

  /**
   * Obtener estado de conexión
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
   * Suscribirse a Tindeq Data Point
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

    try {
      // Primero, establecer modo Streaming
      console.log('[FORCE] Estableciendo modo Streaming...');
      await this.setForceBoardMode(FORCE_BOARD_STREAMING_MODE);
      console.log('[FORCE] Modo Streaming establecido');

      // Luego suscribirse a Force Characteristic
      console.log('[FORCE] Suscribiendo a Force Characteristic...');
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
      console.log('[FORCE] Suscripción a Force Board completada');
    } catch (error) {
      console.error('[FORCE] Error en subscribeForceBoard:', error);
      throw error;
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

            this.onDataCallback?.({
              weight,
              timestamp,
            });
          }
        }
        break;

      case RESP_BATTERY:
        const battery = data[2];
        console.log('[FORCE] Batería:', battery + '%');
        break;

      case RESP_LOW_BATTERY:
        console.warn('[FORCE] Batería baja');
        break;
    }
  }

  /**
   * Procesar notificaciones del Force Board
   */
  private handleForceBoardNotification(characteristic: Characteristic): void {
    try {
      const data = this.base64ToBytes(characteristic.value!);

      if (data.length < 4) {
        return;
      }

      // Force Board envía fuerza en lbs como float32
      const forceLbs = this.bytesToFloat32(data.slice(0, 4));
      const forceKg = forceLbs / 2.20462; // Convertir lbs a kg

      this.onDataCallback?.({
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
   * Utilidades de conversión
   */
  private base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
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
    const view = new DataView(bytes.buffer, bytes.byteOffset, 4);
    return view.getFloat32(0, true); // true = little-endian
  }

  private bytesToUint32(bytes: Uint8Array): number {
    const view = new DataView(bytes.buffer, bytes.byteOffset, 4);
    return view.getUint32(0, true); // true = little-endian
  }
}

export const forceDeviceService = ForceDeviceService.getInstance();
