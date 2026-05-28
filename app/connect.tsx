import { useState, useEffect, useCallback } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  forceDeviceService,
  type DeviceInfo,
} from "@/lib/force-device-service";
import { getDeviceTypeLabel } from "@/i18n/helpers";

type BluetoothDevice = DeviceInfo;

export default function ConnectScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ mode?: string; gameId?: string }>();
  const [isScanning, setIsScanning] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);

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

  const startScanning = useCallback(async () => {
    try {
      setIsScanning(true);
      setDevices([]);

      const hasPermissions = await ensureBluetoothPermissions();
      if (!hasPermissions) {
        setIsScanning(false);
        Alert.alert(
          t("connect.permissionsTitle"),
          t("connect.permissionsMessage"),
          [{ text: t("common.ok") }],
        );
        return;
      }

      await forceDeviceService.scanForDevices((device) => {
        setDevices((prev) => {
          const exists = prev.find((d) => d.id === device.id);
          if (exists) {
            return prev;
          }

          return [...prev, device];
        });
      });

      setTimeout(() => {
        forceDeviceService.stopScan();
        setIsScanning(false);
      }, 10000);
    } catch (error) {
      console.error("Error escaneando:", error);
      setIsScanning(false);

      Alert.alert(
        t("connect.bluetoothErrorTitle"),
        t("connect.bluetoothErrorMessage"),
        [{ text: t("common.ok") }],
      );
    }
  }, [ensureBluetoothPermissions, t]);

  useEffect(() => {
    void startScanning();

    return () => {
      forceDeviceService.stopScan();
    };
  }, [startScanning]);

  const handleDevicePress = async (deviceInfo: BluetoothDevice) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsConnecting(true);

    try {
      await forceDeviceService.connect(deviceInfo.id, deviceInfo.type);

      const gameParams: { mode: string; gameId?: string } = {
        mode: params.mode || "quick",
      };
      if (params.gameId) {
        gameParams.gameId = Array.isArray(params.gameId)
          ? params.gameId[0]
          : params.gameId;
      }
      router.push({
        pathname: "/game",
        params: gameParams,
      });
    } catch (error) {
      console.error("Error conectando:", error);
      setIsConnecting(false);

      Alert.alert(
        t("connect.connectionErrorTitle"),
        t("connect.connectionErrorMessage"),
        [{ text: t("common.ok") }],
      );
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
    startScanning();
  };

  const statusText = isScanning
    ? t("connect.scanning")
    : isConnecting
      ? t("connect.connecting")
      : t("connect.devicesFound", { count: devices.length });

  const renderDevice = ({ item }: { item: BluetoothDevice }) => (
    <TouchableOpacity
      onPress={() => handleDevicePress(item)}
      disabled={isConnecting}
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
            {t("connect.connect")}
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

      {!isScanning && !isConnecting && (
        <FlatList
          data={devices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
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
          }
        />
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
