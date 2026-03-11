import { Buffer } from "buffer";
import {
  ForceBoard,
  Progressor,
  WHC06,
  type ForceMeasurement,
} from "@hangtime/grip-connect-react-native";
import { Platform } from "react-native";

export interface ForceData {
  weight: number;
  timestamp: number;
}

export interface CalibrationData {
  maxForce: number;
  lowZone: number;
  mediumZone: number;
  highZone: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: DeviceType;
}

export type DeviceType = "tindeq" | "force_board" | "wh_c06";

type UnitType = "kg" | "lbs" | "n";
type ForceCallback = (data: ForceData) => void;
type BatteryCallback = (voltage: number) => void;
type ConnectionCallback = (connected: boolean) => void;
type GattDevice = Progressor | ForceBoard | WHC06;
type SupportedDevices = GattDevice | WHC06;

class ForceDeviceService {
  private scanner: Progressor | null = null;
  private device: SupportedDevices | null = null;
  private deviceType: DeviceType | null = null;
  private forceCallback: ForceCallback | null = null;
  private batteryCallback: BatteryCallback | null = null;
  private connectionCallback: ConnectionCallback | null = null;
  private unit: UnitType = "kg";
  private isScanning = false;
  private isConnected = false;

  private initializeScanner(): Progressor {
    if (Platform.OS === "web") {
      throw new Error("Bluetooth no disponible en web");
    }

    if (!this.scanner) {
      this.scanner = new Progressor();
    }

    return this.scanner;
  }

  private detectDeviceType(
    deviceName?: string,
    localName?: string,
  ): DeviceType | "unknown" {
    const name = `${deviceName ?? ""} ${localName ?? ""}`.toLowerCase().trim();

    if (name.includes("progressor") || name.includes("tindeq")) {
      return "tindeq";
    }

    if (
      name.includes("force board") ||
      name.includes("pitchsix") ||
      name.includes("force")
    ) {
      return "force_board";
    }

    if (
      name.includes("wh-c06") ||
      name.includes("if_b7") ||
      name.includes("weiheng")
    ) {
      return "wh_c06";
    }

    return "unknown";
  }

  async scanForDevices(
    onDeviceFound: (device: DeviceInfo) => void,
  ): Promise<void> {
    const scanner = this.initializeScanner();
    const manager = scanner.manager;

    if (this.isScanning) {
      return;
    }

    this.isScanning = true;

    try {
      const state = await manager.state();
      if (state !== "PoweredOn") {
        throw new Error("Bluetooth no está encendido");
      }

      manager.startDeviceScan(
        null,
        { allowDuplicates: false, scanMode: 2, callbackType: 1 },
        (error, device) => {
          if (error) {
            console.error("[FORCE] Error escaneando:", error);
            this.isScanning = false;
            return;
          }

          if (!device?.name) {
            return;
          }

          const deviceType = this.detectDeviceType(device.name);
          if (deviceType === "unknown") {
            return;
          }

          onDeviceFound({
            id: device.id,
            name: device.name,
            type: deviceType,
          });
        },
      );
    } catch (error) {
      this.isScanning = false;
      console.error("[FORCE] Error en scanForDevices:", error);
      throw error;
    }
  }

  stopScan(): void {
    if (this.scanner) {
      this.scanner.manager.stopDeviceScan();
    }
    this.isScanning = false;
  }

  async connect(deviceId: string, deviceType: DeviceType): Promise<void> {
    const scanner = this.initializeScanner();
    const manager = scanner.manager;

    this.stopScan();

    if (this.device?.isConnected()) {
      await this.disconnect();
    }

    const client =
      deviceType === "tindeq"
        ? new Progressor()
        : deviceType === "force_board"
          ? new ForceBoard()
          : deviceType === "wh_c06"
            ? new WHC06()
            : null;
    if (!client) {
      throw new Error("Dispositivo no soportado");
    }
    client.manager = manager;

    try {
      console.log(
        "[FORCE] Conectando a dispositivo:",
        deviceId,
        "tipo:",
        deviceType,
      );

      if (client instanceof WHC06) {
        client.notify((measurement) => {
          this.handleMeasurement(measurement);
        }, this.unit);

        await new Promise<void>((resolve, reject) => {
          client.connect(resolve, reject);
        });

        this.device = client;
        this.deviceType = deviceType;
        this.isConnected = true;
        this.connectionCallback?.(true);

        console.log("[FORCE] Conexión establecida");
        return;
      }

      const connectedDevice = await manager.connectToDevice(deviceId, {
        timeout: 15000,
      });
      client.device = connectedDevice;

      if (client instanceof Progressor || client instanceof ForceBoard) {
        await client.onConnected(() => {
          console.log("[FORCE] Servicios y notificaciones preparados");
        });
      }

      client.notify((measurement) => {
        this.handleMeasurement(measurement);
      }, this.unit);

      connectedDevice.onDisconnected(() => {
        console.log("[FORCE] Dispositivo desconectado");
        this.isConnected = false;
        this.device = null;
        this.deviceType = null;
        this.connectionCallback?.(false);
      });

      this.device = client;
      this.deviceType = deviceType;
      this.isConnected = true;
      this.connectionCallback?.(true);

      console.log("[FORCE] Conexión establecida");
    } catch (error) {
      console.error("[FORCE] Error conectando:", error);
      this.device = null;
      this.deviceType = null;
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.device) {
      return;
    }

    try {
      await this.stopMeasurement();
    } catch (error) {
      console.error("[FORCE] Error deteniendo medición al desconectar:", error);
    }

    try {
      if (this.device instanceof WHC06) {
        this.device.manager.stopDeviceScan();
        this.device.disconnect();
      } else {
        await this.device.disconnect();
      }
    } finally {
      this.device = null;
      this.deviceType = null;
      this.isConnected = false;
      this.connectionCallback?.(false);
    }
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getDeviceType(): DeviceType | null {
    return this.deviceType;
  }

  async tare(): Promise<void> {
    if (!this.device || !this.deviceType) {
      throw new Error("No hay dispositivo conectado");
    }

    if (this.deviceType === "tindeq" || this.deviceType === "wh_c06") {
      this.device.tare();
      return;
    }

    const forceBoard = this.device as ForceBoard;
    try {
      await forceBoard.tareByCharacteristic();
    } catch (error) {
      console.warn(
        "[FORCE] Tare por característica falló, probando por modo:",
        error,
      );
      await forceBoard.tareByMode();
    }
  }

  async startMeasurement(): Promise<void> {
    if (!this.device) {
      throw new Error("No hay dispositivo conectado");
    }

    if (this.device instanceof WHC06) {
      return;
    }

    if (
      this.device instanceof Progressor ||
      this.device instanceof ForceBoard
    ) {
      await this.device.stream();
    }
  }

  async stopMeasurement(): Promise<void> {
    if (!this.device) {
      return;
    }

    if (this.device instanceof WHC06) {
      return;
    }

    if (
      this.device instanceof Progressor ||
      this.device instanceof ForceBoard
    ) {
      await this.device.stop();
    }
  }

  async shutdown(): Promise<void> {
    if (this.deviceType !== "tindeq" || !this.device) {
      return;
    }

    await (this.device as Progressor).sleep();
  }

  async readBattery(): Promise<void> {
    if (!this.device || !this.deviceType) {
      return;
    }

    try {
      if (
        this.device instanceof Progressor ||
        this.device instanceof ForceBoard
      ) {
        const rawValue = await this.device.battery();
        if (!rawValue) {
          return;
        }

        const batteryValue =
          this.deviceType === "tindeq"
            ? this.parseProgressorBattery(rawValue)
            : this.parseForceBoardBattery(rawValue);

        if (batteryValue !== null) {
          this.batteryCallback?.(batteryValue);
        }
      }
    } catch (error) {
      console.error("[FORCE] Error leyendo batería:", error);
    }
  }

  onForceData(callback: ForceCallback): void {
    this.forceCallback = callback;
  }

  onBatteryData(callback: BatteryCallback): void {
    this.batteryCallback = callback;
  }

  onConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallback = callback;
  }

  private handleMeasurement(measurement: ForceMeasurement): void {
    const timestamp = Number(
      measurement.performance?.sampleIndex ?? measurement.timestamp ?? 0,
    );

    this.forceCallback?.({
      weight: measurement.current,
      timestamp,
    });
  }

  private parseProgressorBattery(rawValue: string): number | null {
    const voltage = Number.parseInt(rawValue, 10);
    return Number.isFinite(voltage) ? voltage : null;
  }

  private parseForceBoardBattery(rawValue: string): number | null {
    try {
      const buffer = Buffer.from(rawValue, "base64");
      if (buffer.length === 0) {
        return null;
      }

      const percent = buffer.readUInt8(0);
      return 3000 + percent * 12;
    } catch (error) {
      console.error(
        "[FORCE] Error decodificando batería de Force Board:",
        error,
      );
      return null;
    }
  }
}

export const forceDeviceService = new ForceDeviceService();
