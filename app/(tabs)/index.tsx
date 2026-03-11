import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

/**
 * Home Screen - Gogor Games
 *
 * Pantalla principal donde el usuario puede:
 * - Ver el título del juego
 * - Jugar con un dispositivo de fuerza compatible
 * - Ver el estado de Bluetooth
 */
export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();

  const handleStartPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Navegar a la pantalla de selección de modalidad
    router.push("/mode-select");
  };

  return (
    <ScreenContainer className="flex-1 justify-center items-center p-6">
      {/* Logo/Título */}
      <View className="items-center mb-12">
        <Text className="text-5xl font-bold text-primary mb-2">🦅</Text>
        <Text className="text-3xl font-bold text-foreground text-center">
          Gogor Games
        </Text>
        <Text className="text-base text-muted text-center mt-2">
          Compatible con Tindeq, Force Board y WH-C06
        </Text>
      </View>

      {/* Botón principal */}
      <TouchableOpacity
        onPress={handleStartPress}
        className="bg-primary px-8 py-4 rounded-2xl shadow-lg active:opacity-80 w-full max-w-sm"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-background text-lg font-semibold text-center">
          Comenzar
        </Text>
      </TouchableOpacity>

      {/* Información adicional */}
      <View className="mt-8 items-center">
        <Text className="text-sm text-muted text-center">
          Asegúrate de tener el Bluetooth activado
        </Text>
      </View>
    </ScreenContainer>
  );
}
