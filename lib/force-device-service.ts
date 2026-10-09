import { Buffer } from "buffer";
import {
  ForceBoard,
  FrezDyno,
  Progressor,
  WHC06,
  type ForceMeasurement,
} from "@hangtime/grip-connect-react-native";
import { Platform } from "react-native";
import type { BleManager, Subscription, BleError } from "react-native-ble-plx";

export interface ForceData {
  deviceId: string;
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

export type DeviceType = "tindeq" | "force_board" | "frez_dyno" | "wh_c06";

/** BLE adapter states from react-native-ble-plx, plus web/unavailable. */
export type BluetoothAdapterState =
  | "Unknown"
  | "Resetting"
  | "Unsupported"
  | "Unauthorized"
  | "PoweredOff"
  | "PoweredOn"
  | "unavailable";

const FREZ_ACCESS_KEY = process.env.EXPO_PUBLIC_FREZ_ACCESS_KEY?.trim();

/** 100 unloaded samples at 250 Hz, plus margin, before Frez emits measurements. */
const FREZ_TARE_WINDOW_MS = 500;

type UnitType = "kg" | "lbs" | "n";
type ForceCallback = (data: ForceData) => void;
type BatteryCallback = (voltage: number, deviceId: string) => void;
type ConnectionCallback = (connected: boolean, deviceId: string) => void;
type GattDevice = Progressor | ForceBoard | FrezDyno;
type SupportedDevices = GattDevice | WHC06;

type ScanListener = Parameters<BleManager["startDeviceScan"]>[2];
interface ConnectedDevice {
  info: DeviceInfo;
  client: SupportedDevices;
  subscription?: Subscription;
  advertisementTimeout?: ReturnType<typeof setTimeout>;
}

export class ForceDeviceService {
  private scanner: Progressor | null = null;
  private devices = new Map<string, ConnectedDevice>();
  private pendingConnections = new Map<string, Promise<void>>();
  private scanListeners = new Map<string, ScanListener>();
  private forceCallbacks = new Set<ForceCallback>();
  private batteryCallbacks = new Set<BatteryCallback>();
  private connectionCallbacks = new Set<ConnectionCallback>();
  private unit: UnitType = "kg";
  private scanUpdate: Promise<void> = Promise.resolve();

  // BLE has one scan per manager. Discovery and broadcast-only WH-C06 devices
  // share it so connecting another device never interrupts their measurements.
  private updateScan(): Promise<void> {
    const manager = this.initializeScanner().manager;
    // Native stop/start operations are asynchronous. Serialize reconfiguration
    // so a previous stop cannot cancel a newer discovery or measurement scan.
    this.scanUpdate = this.scanUpdate
      .catch(() => undefined)
      .then(async () => {
        await manager.stopDeviceScan();
        if (this.scanListeners.size === 0) return;
        await manager.startDeviceScan(
          null,
          { allowDuplicates: true, scanMode: 2, callbackType: 1 },
          (error, device) => {
            for (const listener of [...this.scanListeners.values()])
              listener(error, device);
          },
        );
      });
    return this.scanUpdate;
  }

  private scopedManager(deviceId: string): BleManager {
    const manager = this.initializeScanner().manager;
    return new Proxy(manager, {
      get: (target, property) => {
        if (property === "startDeviceScan") {
          return (
            _uuids: unknown,
            _options: unknown,
            listener: ScanListener,
          ) => {
            this.scanListeners.set(deviceId, (error, device) => {
              if (error || device?.id === deviceId) listener(error, device);
            });
            return this.updateScan().catch((error: BleError) =>
              listener(error, null),
            );
          };
        }
        if (property === "stopDeviceScan") {
          return () => {
            if (this.scanListeners.delete(deviceId))
              return this.updateScan().catch(console.error);
            return Promise.resolve();
          };
        }
        const value = Reflect.get(target, property);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  }

  private emitConnection(connected: boolean, deviceId: string): void {
    for (const callback of this.connectionCallbacks)
      callback(connected, deviceId);
  }

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

    if (name.includes("frezdyno") || name.includes("frez dyno")) {
      return "frez_dyno";
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
      name.includes("weiheng") ||
      name.includes("muscle meter")
    ) {
      return "wh_c06";
    }

    return "unknown";
  }

  async getBluetoothState(): Promise<BluetoothAdapterState> {
    if (Platform.OS === "web") {
      return "unavailable";
    }

    try {
      const manager = this.initializeScanner().manager;
      return manager.state();
    } catch (error) {
      console.warn("[FORCE] Bluetooth state unavailable:", error);
      return "unavailable";
    }
  }

  onBluetoothStateChange(
    listener: (state: BluetoothAdapterState) => void,
    emitCurrentState = true,
  ): () => void {
    if (Platform.OS === "web") {
      listener("unavailable");
      return () => {};
    }

    try {
      const manager = this.initializeScanner().manager;
      const subscription = manager.onStateChange(listener, emitCurrentState);
      return () => subscription.remove();
    } catch (error) {
      console.warn("[FORCE] Bluetooth state listener unavailable:", error);
      listener("unavailable");
      return () => {};
    }
  }

  async scanForDevices(
    onDeviceFound: (device: DeviceInfo) => void,
  ): Promise<void> {
    const manager = this.initializeScanner().manager;
    if ((await manager.state()) !== "PoweredOn") {
      throw new Error("Bluetooth no está encendido");
    }
    this.scanListeners.set("discovery", (error, device) => {
      if (error) {
        console.error("[FORCE] Error escaneando:", error);
        return;
      }
      const name = device?.name ?? device?.localName;
      if (!device || !name) return;
      const type = this.detectDeviceType(
        device.name ?? undefined,
        device.localName ?? undefined,
      );
      if (type !== "unknown") onDeviceFound({ id: device.id, name, type });
    });
    await this.updateScan();
  }

  stopScan(): void {
    if (this.scanListeners.delete("discovery"))
      void this.updateScan().catch(console.error);
  }

  connect(
    deviceId: string,
    deviceType: DeviceType,
    name = deviceId,
  ): Promise<void> {
    if (this.devices.has(deviceId)) return Promise.resolve();
    const pending = this.pendingConnections.get(deviceId);
    if (pending) return pending;
    const connection = this.connectDevice(deviceId, deviceType, name).finally(
      () => {
        this.pendingConnections.delete(deviceId);
      },
    );
    this.pendingConnections.set(deviceId, connection);
    return connection;
  }

  private async connectDevice(
    deviceId: string,
    deviceType: DeviceType,
    name: string,
  ): Promise<void> {
    this.initializeScanner();
    if (deviceType === "frez_dyno" && !FREZ_ACCESS_KEY) {
      throw new Error(
        "Falta EXPO_PUBLIC_FREZ_ACCESS_KEY para usar el Frez Dyno",
      );
    }
    const client =
      deviceType === "tindeq"
        ? new Progressor()
        : deviceType === "force_board"
          ? new ForceBoard()
          : deviceType === "frez_dyno"
            ? new FrezDyno({ accessKey: FREZ_ACCESS_KEY })
            : new WHC06();
    // react-native-ble-plx uses a singleton manager; never destroy it here.
    client.manager = this.scopedManager(deviceId);
    client.notify(
      (measurement) => this.handleMeasurement(deviceId, measurement),
      this.unit,
    );
    const entry: ConnectedDevice = {
      info: { id: deviceId, type: deviceType, name },
      client,
    };
    try {
      if (client instanceof WHC06 || client instanceof FrezDyno) {
        // The scoped scan filters by ID, including when two devices share a name.
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Connection timed out")),
            15000,
          );
          const success = () => {
            clearTimeout(timeout);
            resolve();
          };
          const failure = (error: Error) => {
            clearTimeout(timeout);
            reject(error);
          };
          void client.connect(success, failure).catch(failure);
        });
      } else {
        client.device = await client.manager.connectToDevice(deviceId, {
          timeout: 15000,
        });
        await client.onConnected(() => {});
      }
      if (!(client instanceof WHC06)) {
        entry.subscription = client.device?.onDisconnected(() => {
          if (this.devices.get(deviceId) !== entry) return;
          entry.subscription?.remove();
          this.devices.delete(deviceId);
          client.manager.stopDeviceScan();
          this.emitConnection(false, deviceId);
        });
      }
      this.devices.set(deviceId, entry);
      if (client instanceof WHC06) this.watchAdvertisements(entry);
      this.emitConnection(true, deviceId);
    } catch (error) {
      client.manager.stopDeviceScan();
      await Promise.resolve(client.disconnect()).catch(() => undefined);
      throw error;
    }
  }

  private selectedDevices(deviceId?: string): ConnectedDevice[] {
    return deviceId
      ? [this.devices.get(deviceId)].filter(
          (entry): entry is ConnectedDevice => !!entry,
        )
      : [...this.devices.values()];
  }

  async disconnect(deviceId?: string): Promise<void> {
    const results = await Promise.allSettled(
      this.selectedDevices(deviceId).map(async (entry) => {
        const { client, info } = entry;
        try {
          if (entry.advertisementTimeout)
            clearTimeout(entry.advertisementTimeout);
          await this.stopMeasurement(info.id).catch(() => undefined);
          entry.subscription?.remove();
          client.manager.stopDeviceScan();
          await client.disconnect();
        } finally {
          this.devices.delete(info.id);
          this.emitConnection(false, info.id);
        }
      }),
    );
    const failure = results.find((result) => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
  }

  getConnectedDevices(): DeviceInfo[] {
    return [...this.devices.values()].map((entry) => ({ ...entry.info }));
  }

  getIsConnected(deviceId?: string): boolean {
    return deviceId ? this.devices.has(deviceId) : this.devices.size > 0;
  }

  getDeviceType(deviceId?: string): DeviceType | null {
    return this.selectedDevices(deviceId)[0]?.info.type ?? null;
  }

  async tare(deviceId?: string): Promise<void> {
    const entries = this.selectedDevices(deviceId);
    if (!entries.length) throw new Error("No hay dispositivo conectado");
    await Promise.all(
      entries.map(async ({ client }) => {
        if (client instanceof FrezDyno) return;
        if (client instanceof ForceBoard) {
          try {
            await client.tareByCharacteristic();
          } catch {
            await client.tareByMode();
          }
        } else {
          await client.tare();
        }
      }),
    );
  }

  async startMeasurement(deviceId?: string): Promise<void> {
    const entries = this.selectedDevices(deviceId);
    if (!entries.length) throw new Error("No hay dispositivo conectado");
    try {
      await Promise.all(
        entries.map(async ({ client }) => {
          if (client instanceof WHC06) return;
          await client.stream();
          if (client instanceof FrezDyno) {
            await new Promise<void>((resolve) =>
              setTimeout(resolve, FREZ_TARE_WINDOW_MS),
            );
          }
        }),
      );
    } catch (error) {
      await this.stopMeasurement(deviceId).catch(() => undefined);
      throw error;
    }
  }

  async stopMeasurement(deviceId?: string): Promise<void> {
    const results = await Promise.allSettled(
      this.selectedDevices(deviceId).map(async ({ client }) => {
        if (!(client instanceof WHC06)) await client.stop();
      }),
    );
    const failure = results.find((result) => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
  }

  async shutdown(deviceId?: string): Promise<void> {
    await Promise.all(
      this.selectedDevices(deviceId).map(async ({ client }) => {
        if (client instanceof Progressor) await client.sleep();
      }),
    );
  }

  async readBattery(deviceId?: string): Promise<void> {
    await Promise.all(
      this.selectedDevices(deviceId).map(async ({ client, info }) => {
        if (client instanceof WHC06) return;
        try {
          const rawValue = await client.battery();
          if (!rawValue) return;
          const value =
            info.type === "tindeq"
              ? this.parseProgressorBattery(rawValue)
              : info.type === "force_board"
                ? this.parseForceBoardBattery(rawValue)
                : this.parseFrezDynoBattery(rawValue);
          if (value !== null) {
            for (const callback of this.batteryCallbacks)
              callback(value, info.id);
          }
        } catch (error) {
          console.error("[FORCE] Error leyendo batería:", error);
        }
      }),
    );
  }

  onForceData(callback: ForceCallback): () => void {
    this.forceCallbacks.add(callback);
    return () => {
      this.forceCallbacks.delete(callback);
    };
  }

  onBatteryData(callback: BatteryCallback): () => void {
    this.batteryCallbacks.add(callback);
    return () => {
      this.batteryCallbacks.delete(callback);
    };
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  private watchAdvertisements(entry: ConnectedDevice): void {
    if (entry.advertisementTimeout) clearTimeout(entry.advertisementTimeout);
    entry.advertisementTimeout = setTimeout(() => {
      // Broadcast-only devices have no GATT disconnection event.
      void this.disconnect(entry.info.id).catch(console.error);
    }, 10000);
  }

  private handleMeasurement(
    deviceId: string,
    measurement: ForceMeasurement,
  ): void {
    if (!Number.isFinite(measurement.current)) return;
    const entry = this.devices.get(deviceId);
    if (entry?.client instanceof WHC06) this.watchAdvertisements(entry);
    const timestamp = Number(
      measurement.performance?.sampleIndex ?? measurement.timestamp ?? 0,
    );
    for (const callback of this.forceCallbacks) {
      callback({ deviceId, weight: measurement.current, timestamp });
    }
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

  private parseFrezDynoBattery(rawValue: string): number | null {
    const percent = Number.parseInt(rawValue, 10);
    return Number.isFinite(percent) ? percent : null;
  }
}

export const forceDeviceService = new ForceDeviceService();
