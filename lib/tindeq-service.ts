/**
 * Tindeq Progressor Bluetooth Service
 * 
 * Maneja la conexión y comunicación con el Tindeq Progressor via BLE.
 * API Reference: https://tindeq.com/progressor_api/
 */

import { Platform } from 'react-native';

// Tipos para BLE
type Device = any;
type Characteristic = any;
type BleManagerType = any;

// UUIDs del Tindeq Progressor (verificados contra código oficial)
const TINDEQ_SERVICE_UUID = '7e4e1701-1ea6-40c9-9dcc-13d34ffead57';
const DATA_POINT_UUID = '7e4e1702-1ea6-40c9-9dcc-13d34ffead57'; // Para recibir datos
const CONTROL_POINT_UUID = '7e4e1703-1ea6-40c9-9dcc-13d34ffead57'; // Para enviar comandos

// Comandos del Progressor
const CMD_TARE = 0x64;
const CMD_START_MEASUREMENT = 0x65;
const CMD_STOP_MEASUREMENT = 0x66;
const CMD_SHUTDOWN = 0x6e;
const CMD_BATTERY = 0x6f;

// Response codes
const RESP_BATTERY = 0x00;
const RESP_WEIGHT = 0x01;
const RESP_LOW_BATTERY = 0x04;

export interface ForceData {
  weight: number; // kg
  timestamp: number; // microseconds
}

export interface CalibrationData {
  maxForce: number; // kg
  lowZone: number; // 0-33%
  mediumZone: number; // 33-66%
  highZone: number; // 66-100%
}

type ForceCallback = (data: ForceData) => void;
type BatteryCallback = (voltage: number) => void;
type ConnectionCallback = (connected: boolean) => void;

class TindeqService {
  private manager: BleManagerType | null = null;
  private device: Device | null = null;
  private forceCallback: ForceCallback | null = null;
  private batteryCallback: BatteryCallback | null = null;
  private connectionCallback: ConnectionCallback | null = null;
  private isScanning = false;
  private isConnected = false;

  constructor() {
    // No inicializar BleManager en el constructor
    // Se inicializará de forma lazy cuando se necesite
  }

  /**
   * Inicializar BleManager de forma lazy
   */
  private initializeManager(): void {
    if (this.manager) {
      return; // Ya inicializado
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
   * Escanear dispositivos Tindeq cercanos
   */
  async scanForDevices(onDeviceFound: (device: Device) => void): Promise<void> {
    try {
      this.initializeManager();

      if (!this.manager) {
        throw new Error('Bluetooth no disponible en esta plataforma');
      }

      if (this.isScanning) {
        return;
      }

      this.isScanning = true;

      // Verificar permisos en Android
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
        this.manager.startDeviceScan(
          [TINDEQ_SERVICE_UUID],
          { allowDuplicates: false },
          (error: any, device: Device) => {
            try {
              if (error) {
                console.error('Error escaneando:', error);
                this.isScanning = false;
                return;
              }

              if (device && device.name?.toLowerCase().includes('progressor')) {
                onDeviceFound(device);
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
   * Conectar a un dispositivo Tindeq
   */
  async connect(deviceId: string): Promise<void> {
    this.initializeManager();

    if (!this.manager) {
      throw new Error('Bluetooth no disponible en esta plataforma');
    }

    try {
      this.stopScan();

      // Conectar al dispositivo
      this.device = await this.manager.connectToDevice(deviceId);
      
      // Descubrir servicios y características
      await this.device.discoverAllServicesAndCharacteristics();

      this.isConnected = true;
      this.connectionCallback?.(true);

      // Configurar listener para desconexión
      this.device.onDisconnected(() => {
        this.isConnected = false;
        this.device = null;
        this.connectionCallback?.(false);
      });

      // Suscribirse al Data Point para recibir datos
      await this.subscribeToDataPoint();

    } catch (error) {
      console.error('Error conectando:', error);
      this.isConnected = false;
      this.device = null;
      throw error;
    }
  }

  /**
   * Desconectar del dispositivo
   */
  async disconnect(): Promise<void> {
    if (this.device) {
      await this.stopMeasurement();
      await this.device.cancelConnection();
      this.device = null;
      this.isConnected = false;
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
   * Suscribirse al Data Point para recibir notificaciones
   */
  private async subscribeToDataPoint(): Promise<void> {
    if (!this.device) {
      throw new Error('No hay dispositivo conectado');
    }

    await this.device.monitorCharacteristicForService(
      TINDEQ_SERVICE_UUID,
      DATA_POINT_UUID,
      (error: any, characteristic: Characteristic) => {
        if (error) {
          console.error('Error monitoreando Data Point:', error);
          return;
        }

        if (characteristic?.value) {
          this.handleDataPointNotification(characteristic);
        }
      }
    );
  }

  /**
   * Procesar notificaciones del Data Point
   */
  private handleDataPointNotification(characteristic: Characteristic): void {
    const data = this.base64ToBytes(characteristic.value!);
    
    if (data.length < 2) {
      return;
    }

    const responseCode = data[0];
    const length = data[1];

    switch (responseCode) {
      case RESP_WEIGHT:
        // Procesar TODAS las mediciones en el paquete (cada 8 bytes)
        // Formato: [response_code][length][weight1][timestamp1][weight2][timestamp2]...
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
        console.warn('Batería baja del Tindeq');
        break;
    }
  }

  /**
   * Enviar comando al Control Point
   */
  private async sendCommand(opcode: number, value?: Uint8Array): Promise<void> {
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
      CONTROL_POINT_UUID,
      base64Command
    );
  }

  /**
   * Calibrar (TARE) - establecer cero cuando no hay carga
   */
  async tare(): Promise<void> {
    await this.sendCommand(CMD_TARE);
  }

  /**
   * Iniciar medición de fuerza (80 Hz)
   */
  async startMeasurement(): Promise<void> {
    await this.sendCommand(CMD_START_MEASUREMENT);
  }

  /**
   * Detener medición de fuerza
   */
  async stopMeasurement(): Promise<void> {
    await this.sendCommand(CMD_STOP_MEASUREMENT);
  }

  /**
   * Apagar el Progressor
   */
  async shutdown(): Promise<void> {
    await this.sendCommand(CMD_SHUTDOWN);
  }

  /**
   * Leer voltaje de batería
   */
  async readBattery(): Promise<void> {
    await this.sendCommand(CMD_BATTERY);
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
    return view.getFloat32(0, true); // true = little endian
  }

  private bytesToUint32(bytes: Uint8Array): number {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    for (let i = 0; i < 4; i++) {
      view.setUint8(i, bytes[i]);
    }
    return view.getUint32(0, true); // true = little endian
  }
}

// Singleton instance
export const tindeqService = new TindeqService();
