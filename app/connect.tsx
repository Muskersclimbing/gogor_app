import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  Alert,
  PermissionsAndroid,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  forceDeviceService,
  type DeviceInfo,
} from "@/lib/force-device-service";
import { shouldAutoCalibrate } from "@/lib/multidevice-game";
import { getDeviceTypeLabel } from "@/i18n/helpers";

type BluetoothDevice = DeviceInfo;

export default function ConnectScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ mode?: string; gameId?: string }>();
  const [isScanning, setIsScanning] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedDevices, setConnectedDevices] = useState(() =>
    forceDeviceService.getConnectedDevices(),
  );
  const [devices, setDevices] = useState<BluetoothDevice[]>(() =>
    forceDeviceService.getConnectedDevices(),
  );
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);
  const navigating = useRef(false);
  const connectionInProgress = useRef(false);
  const isConnecting = connectingId !== null;

  const goToCalibration = useCallback(() => {
    if (navigating.current || !forceDeviceService.getIsConnected()) return;
    navigating.current = true;
    forceDeviceService.stopScan();
    router.push({
      pathname: "/game",
      params: {
        mode: params.mode || "quick",
        ...(params.gameId ? { gameId: params.gameId } : {}),
      },
    });
  }, [params.gameId, params.mode, router]);

  const ensureBluetoothPermissions = useCallback(async () => {
    if (Platform.OS !== "android") {
      return true;
    }

    const androidVersion = Number(Platform.Version);
    const permissions =
      androidVersion >= 31
        ? [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          ]
        : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

    const results = await PermissionsAndroid.requestMultiple(permissions);

    return permissions.every(
      (permission) =>
        results[permission] === PermissionsAndroid.RESULTS.GRANTED,
    );
  }, []);

  const runScan = useCallback(() => {
    if (scanTimer.current) clearTimeout(scanTimer.current);
    return ensureBluetoothPermissions()
      .then(async (hasPermissions) => {
        if (!mounted.current) return;
        setConnectedDevices(forceDeviceService.getConnectedDevices());
        if (!hasPermissions) {
          setIsScanning(false);
          Alert.alert(
            t("connect.permissionsTitle"),
            t("connect.permissionsMessage"),
          );
          return;
        }
        await forceDeviceService.scanForDevices((device) => {
          if (!mounted.current) return;
          setDevices((prev) =>
            prev.some((item) => item.id === device.id)
              ? prev
              : [...prev, device],
          );
        });
        if (!mounted.current) {
          forceDeviceService.stopScan();
          return;
        }
        scanTimer.current = setTimeout(() => {
          forceDeviceService.stopScan();
          if (mounted.current) setIsScanning(false);
        }, 10000);
      })
      .catch(() => {
        if (!mounted.current) return;
        setIsScanning(false);
        Alert.alert(
          t("connect.bluetoothErrorTitle"),
          t("connect.bluetoothErrorMessage"),
        );
      });
  }, [ensureBluetoothPermissions, t]);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      navigating.current = false;
      const unsubscribe = forceDeviceService.onConnectionChange(() => {
        if (mounted.current)
          setConnectedDevices(forceDeviceService.getConnectedDevices());
      });
      void runScan();
      return () => {
        mounted.current = false;
        unsubscribe();
        if (scanTimer.current) clearTimeout(scanTimer.current);
        forceDeviceService.stopScan();
      };
    }, [runScan]),
  );

  useEffect(() => {
    // Wait for discovery to finish: the first advertisement does not mean only
    // one device is available. With multiple discoveries the user chooses when.
    if (
      shouldAutoCalibrate(
        isScanning,
        isConnecting,
        devices.length,
        connectedDevices.length,
      )
    ) {
      goToCalibration();
    }
  }, [
    connectedDevices.length,
    devices.length,
    goToCalibration,
    isConnecting,
    isScanning,
  ]);

  const handleDevicePress = async (deviceInfo: BluetoothDevice) => {
    if (
      connectionInProgress.current ||
      forceDeviceService.getIsConnected(deviceInfo.id)
    )
      return;
    connectionInProgress.current = true;
    setConnectingId(deviceInfo.id);
    if (Platform.OS !== "web")
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await forceDeviceService.connect(
        deviceInfo.id,
        deviceInfo.type,
        deviceInfo.name,
      );
      if (!mounted.current && !navigating.current) {
        await forceDeviceService.disconnect(deviceInfo.id);
      } else if (mounted.current) {
        setConnectedDevices(forceDeviceService.getConnectedDevices());
      }
    } catch {
      if (mounted.current)
        Alert.alert(
          t("connect.connectionErrorTitle"),
          t("connect.connectionErrorMessage"),
        );
    } finally {
      connectionInProgress.current = false;
      if (mounted.current) setConnectingId(null);
    }
  };

  const handleCancelPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    forceDeviceService.stopScan();
    router.back();
  };

  const handleRetryPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsScanning(true);
    void runScan();
  };

  const statusText = isConnecting
    ? t("connect.connecting")
    : isScanning
      ? t("connect.scanning")
      : t("connect.devicesFound", { count: devices.length });

  const renderDevice = ({ item }: { item: BluetoothDevice }) => (
    <TouchableOpacity
      onPress={() => handleDevicePress(item)}
      disabled={
        isConnecting || connectedDevices.some((device) => device.id === item.id)
      }
      className="bg-surface p-4 rounded-xl mb-3 border border-border active:opacity-70"
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-foreground font-semibold text-lg">
            {item.name}
          </Text>
          <Text className="text-muted text-sm mt-1">
            {t("connect.deviceType", {
              type: getDeviceTypeLabel(t, item.type),
            })}
          </Text>
        </View>
        <View className="bg-primary px-4 py-2 rounded-lg">
          <Text className="text-background font-medium">
            {connectedDevices.some((device) => device.id === item.id)
              ? t("connect.connected")
              : connectingId === item.id
                ? t("connect.connecting")
                : t("connect.connect")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1 p-6">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-foreground">
          {t("connect.title")}
        </Text>
        <Text className="text-muted mt-1">{statusText}</Text>
      </View>

      {(isScanning || isConnecting) && (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-4">
            {isScanning
              ? t("connect.scanningDetail")
              : t("connect.connectingDetail")}
          </Text>
        </View>
      )}

      <FlatList
        className="flex-1"
        data={devices}
        extraData={{ connectedDevices, connectingId }}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          isScanning ? null : (
            <View className="items-center py-8">
              <Text className="text-muted text-center mb-4">
                {t("connect.empty")}
              </Text>
              <TouchableOpacity
                onPress={handleRetryPress}
                className="bg-primary px-6 py-3 rounded-full active:opacity-80"
              >
                <Text className="text-background font-semibold">
                  {t("connect.searchAgain")}
                </Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {(devices.length > 1 || connectedDevices.length > 1) && (
        <TouchableOpacity
          onPress={goToCalibration}
          disabled={isConnecting || connectedDevices.length === 0}
          className="bg-primary px-6 py-4 rounded-xl mt-4 active:opacity-70"
          style={{
            opacity: isConnecting || connectedDevices.length === 0 ? 0.5 : 1,
          }}
        >
          <Text className="text-background text-center font-semibold">
            {t("connect.calibrate", { count: connectedDevices.length })}
          </Text>
        </TouchableOpacity>
      )}

      {!isConnecting && (
        <TouchableOpacity
          onPress={handleCancelPress}
          className="bg-surface border border-border px-6 py-4 rounded-xl mt-4 active:opacity-70"
        >
          <Text className="text-foreground text-center font-medium">
            {t("common.cancel")}
          </Text>
        </TouchableOpacity>
      )}
    </ScreenContainer>
  );
}
