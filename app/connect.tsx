import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Platform, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { forceDeviceService, type DeviceInfo } from "@/lib/force-device-service";

type BluetoothDevice = DeviceInfo & {
  rssi?: number;
};

/**
 * Connect Screen - Búsqueda y conexión de dispositivos Bluetooth
 * 
 * Permite al usuario:
 * - Ver dispositivos Tindeq y Force Board cercanos
 * - Conectarse al dispositivo seleccionado
 * - Ver el estado de la búsqueda
 */
export default function ConnectScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; gameId?: string }>();
  const [isScanning, setIsScanning] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<'tindeq' | 'force_board' | null>(null);

  useEffect(() => {
    startScanning();

    return () => {
      forceDeviceService.stopScan();
    };
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setDevices([]);

      await forceDeviceService.scanForDevices((device) => {
        setDevices((prev) => {
          const exists = prev.find((d) => d.id === device.id);
          if (exists) {
            return prev;
          }

          const deviceName = device.type === 'tindeq' 
            ? 'Tindeq Progressor'
            : device.type === 'force_board'
            ? 'Force Board'
            : device.name;

          return [
            ...prev,
            {
              id: device.id,
              name: deviceName,
              type: device.type,
              rssi: undefined,
            },
          ];
        });
      });

      // Detener escaneo después de 10 segundos
      setTimeout(() => {
        forceDeviceService.stopScan();
        setIsScanning(false);
      }, 10000);

    } catch (error) {
      console.error("Error escaneando:", error);
      setIsScanning(false);
      
      Alert.alert(
        "Error de Bluetooth",
        "No se pudo iniciar el escaneo. Asegúrate de que Bluetooth esté activado y que la app tenga los permisos necesarios.",
        [{ text: "OK" }]
      );
    }
  };

  const handleDevicePress = async (deviceInfo: BluetoothDevice) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (deviceInfo.type === 'unknown') {
      Alert.alert('Error', 'Tipo de dispositivo no reconocido');
      return;
    }

    setIsConnecting(true);
    setSelectedDeviceType(deviceInfo.type);

    try {
      // Conectar al dispositivo
      await forceDeviceService.connect(deviceInfo.id, deviceInfo.type);

      // Navegar a la pantalla de calibración/juego con el modo seleccionado
      const gameParams: any = { mode: params.mode || "quick" };
      if (params.gameId) {
        gameParams.gameId = Array.isArray(params.gameId) ? params.gameId[0] : params.gameId;
        console.log("[DEBUG] Pasando gameId a game.tsx:", gameParams.gameId);
      }
      router.push({
        pathname: "/game",
        params: gameParams,
      });

    } catch (error) {
      console.error("Error conectando:", error);
      setIsConnecting(false);
      setSelectedDeviceType(null);

      Alert.alert(
        "Error de conexión",
        "No se pudo conectar al dispositivo. Inténtalo de nuevo.",
        [{ text: "OK" }]
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

  const getDeviceTypeLabel = (type: string) => {
    switch (type) {
      case 'tindeq':
        return 'Tindeq Progressor';
      case 'force_board':
        return 'Force Board';
      default:
        return 'Dispositivo desconocido';
    }
  };

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
            {getDeviceTypeLabel(item.type)}
          </Text>
        </View>
        <View className="bg-primary px-4 py-2 rounded-lg">
          <Text className="text-background font-medium">Conectar</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1 p-6">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-foreground">
          Buscar Dispositivo
        </Text>
        <Text className="text-muted mt-1">
          {isScanning 
            ? "Buscando dispositivos..." 
            : isConnecting
            ? `Conectando a ${selectedDeviceType === 'tindeq' ? 'Tindeq' : 'Force Board'}...`
            : `${devices.length} dispositivo${devices.length !== 1 ? 's' : ''} encontrado${devices.length !== 1 ? 's' : ''}`
          }
        </Text>
      </View>

      {/* Loading indicator */}
      {(isScanning || isConnecting) && (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-4">
            {isScanning ? "Escaneando dispositivos Bluetooth..." : "Conectando al dispositivo..."}
          </Text>
        </View>
      )}

      {/* Devices list */}
      {!isScanning && !isConnecting && (
        <FlatList
          data={devices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-muted text-center mb-4">
                No se encontraron dispositivos.{"\n"}
                Asegúrate de que el Tindeq o Force Board esté encendido.
              </Text>
              <TouchableOpacity
                onPress={handleRetryPress}
                className="bg-primary px-6 py-3 rounded-full active:opacity-80"
              >
                <Text className="text-background font-semibold">Buscar de nuevo</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Cancel button */}
      {!isConnecting && (
        <TouchableOpacity
          onPress={handleCancelPress}
          className="bg-surface border border-border px-6 py-4 rounded-xl mt-4 active:opacity-70"
        >
          <Text className="text-foreground text-center font-medium">
            Cancelar
          </Text>
        </TouchableOpacity>
      )}
    </ScreenContainer>
  );
}
