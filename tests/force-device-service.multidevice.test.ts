import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ble = vi.hoisted(() => {
  type Advertisement = { id: string; name: string; localName: string };
  type Listener = (error: Error | null, device: Advertisement | null) => void;
  const disconnected = new Map<string, () => void>();
  const manager = {
    state: vi.fn(async () => "PoweredOn"),
    destroy: vi.fn(),
    startDeviceScan: vi.fn(
      (_uuids: unknown, _options: unknown, callback: Listener) => {
        scan = callback;
      },
    ),
    stopDeviceScan: vi.fn(() => {
      scan = null;
    }),
    connectToDevice: vi.fn(async (id: string) => {
      if (id === "broken") throw new Error("connection failed");
      return {
        id,
        onDisconnected: (callback: () => void) => {
          disconnected.set(id, callback);
          return { remove: () => disconnected.delete(id) };
        },
      };
    }),
    cancelDeviceConnection: vi.fn(async (id: string) => {
      disconnected.get(id)?.();
    }),
  };
  let scan: Listener | null = null;
  const clients: Client[] = [];
  class Client {
    manager = manager;
    device?: Awaited<ReturnType<typeof manager.connectToDevice>>;
    notifyCallback?: (measurement: {
      current: number;
      timestamp: number;
    }) => void;
    tare = vi.fn(async () => {});
    stream = vi.fn(async () => {});
    stop = vi.fn(async () => {});
    battery = vi.fn(async () => "80");
    constructor() {
      clients.push(this);
    }
    notify(callback: Client["notifyCallback"]) {
      this.notifyCallback = callback;
    }
    async onConnected(success: () => void) {
      success();
    }
    async disconnect() {
      if (this.device)
        await this.manager.cancelDeviceConnection(this.device.id);
    }
  }
  class Progressor extends Client {
    sleep = vi.fn(async () => {});
  }
  class ForceBoard extends Client {
    tareByCharacteristic = vi.fn(async () => {});
    tareByMode = vi.fn(async () => {});
  }
  class FrezDyno extends Client {
    async connect(success: () => void, failure: (error: Error) => void) {
      this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) return failure(error);
        if (!device?.name.startsWith("FrezDyno")) return;
        this.manager.stopDeviceScan();
        void this.manager.connectToDevice(device.id).then((connected) => {
          this.device = connected;
          success();
        });
      });
    }
  }
  class WHC06 extends Client {
    async connect(success: () => void, failure: (error: Error) => void) {
      let connected = false;
      this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) return failure(error);
        if (device?.name !== "IF_B7") return;
        if (!connected) {
          connected = true;
          success();
        }
        this.notifyCallback?.({
          current: device.id === "scale-a" ? 5 : 10,
          timestamp: 1,
        });
      });
    }
  }
  return {
    manager,
    clients,
    disconnected,
    Progressor,
    ForceBoard,
    FrezDyno,
    WHC06,
    advertise: (id: string, name: string) =>
      scan?.(null, { id, name, localName: name }),
    reset: () => {
      scan = null;
      clients.length = 0;
      disconnected.clear();
    },
  };
});
vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));
vi.mock("@hangtime/grip-connect-react-native", () => ({
  Progressor: ble.Progressor,
  ForceBoard: ble.ForceBoard,
  FrezDyno: ble.FrezDyno,
  WHC06: ble.WHC06,
}));

let service: import("../lib/force-device-service").ForceDeviceService;
beforeEach(async () => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  ble.reset();
  vi.stubEnv("EXPO_PUBLIC_FREZ_ACCESS_KEY", "test-key");
  vi.resetModules();
  const { ForceDeviceService } = await import("../lib/force-device-service");
  service = new ForceDeviceService();
});
afterEach(async () => {
  await service.disconnect();
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("multiple force devices", () => {
  it("keeps two GATT connections and labels their independent force packets", async () => {
    const readings = vi.fn();
    const unsubscribe = service.onForceData(readings);
    await service.connect("a", "tindeq", "Tindeq A");
    await service.connect("b", "force_board", "Force Board B");
    expect(service.getConnectedDevices().map((device) => device.id)).toEqual([
      "a",
      "b",
    ]);
    expect(ble.manager.cancelDeviceConnection).not.toHaveBeenCalled();
    expect(ble.manager.destroy).not.toHaveBeenCalled();
    ble.clients[1].notifyCallback?.({ current: 12, timestamp: 1 });
    ble.clients[2].notifyCallback?.({ current: 24, timestamp: 2 });
    expect(
      readings.mock.calls.map(([data]) => [data.deviceId, data.weight]),
    ).toEqual([
      ["a", 12],
      ["b", 24],
    ]);
    unsubscribe();
    ble.clients[1].notifyCallback?.({ current: 30, timestamp: 3 });
    expect(readings).toHaveBeenCalledTimes(2);
  });

  it("tares and streams the selected calibration device, then all devices for play", async () => {
    await service.connect("a", "tindeq");
    await service.connect("b", "tindeq");
    await service.tare("b");
    await service.startMeasurement("b");
    await service.stopMeasurement("b");
    expect(ble.clients[1].tare).not.toHaveBeenCalled();
    expect(ble.clients[1].stream).not.toHaveBeenCalled();
    expect(ble.clients[2].tare).toHaveBeenCalledOnce();
    await service.startMeasurement();
    await service.stopMeasurement();
    expect(ble.clients[1].stream).toHaveBeenCalledOnce();
    expect(ble.clients[2].stream).toHaveBeenCalledTimes(2);
    expect(service.getConnectedDevices()).toHaveLength(2);
  });

  it("does not lose an existing connection when another connection fails", async () => {
    await service.connect("a", "tindeq");
    await expect(service.connect("broken", "tindeq")).rejects.toThrow(
      "connection failed",
    );
    expect(service.getIsConnected("a")).toBe(true);
    expect(service.getConnectedDevices()).toHaveLength(1);
  });

  it("reports which device disconnected while retaining the other", async () => {
    const listener = vi.fn();
    service.onConnectionChange(listener);
    await service.connect("a", "tindeq");
    await service.connect("b", "tindeq");
    ble.disconnected.get("a")?.();
    expect(listener).toHaveBeenLastCalledWith(false, "a");
    expect(service.getIsConnected()).toBe(true);
    expect(service.getConnectedDevices().map((device) => device.id)).toEqual([
      "b",
    ]);
  });

  it("deduplicates concurrent connection attempts", async () => {
    await Promise.all([
      service.connect("a", "tindeq"),
      service.connect("a", "tindeq"),
    ]);
    await service.connect("a", "tindeq");
    expect(ble.manager.connectToDevice).toHaveBeenCalledTimes(1);
  });

  it("filters two Frez Dynos by selected ID even when they have the same name", async () => {
    const first = service.connect("frez-a", "frez_dyno");
    await vi.advanceTimersByTimeAsync(0);
    ble.advertise("frez-b", "FrezDyno-Test");
    expect(ble.manager.connectToDevice).not.toHaveBeenCalled();
    ble.advertise("frez-a", "FrezDyno-Test");
    await first;
    const second = service.connect("frez-b", "frez_dyno");
    await vi.advanceTimersByTimeAsync(0);
    ble.advertise("frez-a", "FrezDyno-Test");
    ble.advertise("frez-b", "FrezDyno-Test");
    await second;
    expect(service.getConnectedDevices().map((device) => device.id)).toEqual([
      "frez-a",
      "frez-b",
    ]);
    const measurement = service.startMeasurement();
    await vi.advanceTimersByTimeAsync(500);
    await measurement;
    expect(ble.clients[1].stream).toHaveBeenCalledOnce();
    expect(ble.clients[2].stream).toHaveBeenCalledOnce();
  });

  it("shares discovery with two WH-C06 streams without mixing their readings", async () => {
    const readings = vi.fn();
    service.onForceData(readings);
    const first = service.connect("scale-a", "wh_c06");
    await vi.advanceTimersByTimeAsync(0);
    ble.advertise("scale-a", "IF_B7");
    await first;
    const found = vi.fn();
    await service.scanForDevices(found);
    const second = service.connect("scale-b", "wh_c06");
    await vi.advanceTimersByTimeAsync(0);
    ble.advertise("scale-b", "IF_B7");
    await second;
    expect(found).toHaveBeenCalledWith({
      id: "scale-b",
      name: "IF_B7",
      type: "wh_c06",
    });
    service.stopScan();
    await vi.advanceTimersByTimeAsync(0);
    readings.mockClear();
    ble.advertise("scale-a", "IF_B7");
    ble.advertise("scale-b", "IF_B7");
    expect(
      readings.mock.calls.map(([data]) => [data.deviceId, data.weight]),
    ).toEqual([
      ["scale-a", 5],
      ["scale-b", 10],
    ]);
    await service.disconnect("scale-a");
    await vi.advanceTimersByTimeAsync(0);
    readings.mockClear();
    ble.advertise("scale-b", "IF_B7");
    expect(readings).toHaveBeenCalledWith({
      deviceId: "scale-b",
      weight: 10,
      timestamp: 1,
    });
  });

  it("detects loss of a WH-C06 advertisement stream without dropping a GATT device", async () => {
    const listener = vi.fn();
    service.onConnectionChange(listener);
    await service.connect("a", "tindeq");
    const scale = service.connect("scale-a", "wh_c06");
    await vi.advanceTimersByTimeAsync(0);
    ble.advertise("scale-a", "IF_B7");
    await scale;
    await vi.advanceTimersByTimeAsync(10001);
    expect(listener).toHaveBeenLastCalledWith(false, "scale-a");
    expect(service.getConnectedDevices().map((device) => device.id)).toEqual([
      "a",
    ]);
  });

  it("stops all devices if starting one stream fails", async () => {
    await service.connect("a", "tindeq");
    await service.connect("b", "tindeq");
    ble.clients[2].stream.mockRejectedValueOnce(new Error("stream failed"));
    await expect(service.startMeasurement()).rejects.toThrow("stream failed");
    expect(ble.clients[1].stop).toHaveBeenCalledOnce();
    expect(ble.clients[2].stop).toHaveBeenCalledOnce();
  });
});
