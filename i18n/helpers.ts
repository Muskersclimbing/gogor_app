import type { TFunction } from "i18next";

import type { DeviceInfo } from "@/lib/force-device-service";

const DEVICE_TYPE_KEYS: Record<
  DeviceInfo["type"],
  "tindeq" | "forceBoard" | "whC06"
> = {
  tindeq: "tindeq",
  force_board: "forceBoard",
  wh_c06: "whC06",
};

export function getDeviceTypeLabel(
  t: TFunction,
  type: DeviceInfo["type"] | string,
): string {
  const key = DEVICE_TYPE_KEYS[type as DeviceInfo["type"]];
  return key ? t(`devices.${key}`) : t("devices.unknown");
}

export function getModeLabel(t: TFunction, mode?: string): string {
  if (mode === "quick" || mode === "total" || mode === "resistance") {
    return t(`modes.${mode}`);
  }
  return t("modes.default");
}
