import { useEffect, useState } from "react";

import {
  forceDeviceService,
  type BluetoothAdapterState,
} from "@/lib/force-device-service";

export type BluetoothStatusMessageKey =
  | "home.bluetoothOn"
  | "home.bluetoothOff"
  | "home.bluetoothUnauthorized"
  | "home.bluetoothUnavailable"
  | "home.bluetoothChecking";

export function getBluetoothStatusMessageKey(
  state: BluetoothAdapterState,
): BluetoothStatusMessageKey {
  switch (state) {
    case "PoweredOn":
      return "home.bluetoothOn";
    case "PoweredOff":
      return "home.bluetoothOff";
    case "Unauthorized":
      return "home.bluetoothUnauthorized";
    case "Unsupported":
    case "unavailable":
      return "home.bluetoothUnavailable";
    case "Resetting":
    case "Unknown":
    default:
      return "home.bluetoothChecking";
  }
}

export function useBluetoothState() {
  const [state, setState] = useState<BluetoothAdapterState>("Unknown");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = forceDeviceService.onBluetoothStateChange((nextState) => {
        if (!cancelled) {
          setState(nextState);
        }
      }, true);
    } catch (error) {
      console.warn("[Bluetooth] Failed to initialize state listener:", error);
      if (!cancelled) {
        setState("unavailable");
      }
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return {
    state,
    isReady: state === "PoweredOn",
    isChecking: state === "Unknown" || state === "Resetting",
    messageKey: getBluetoothStatusMessageKey(state),
  };
}
