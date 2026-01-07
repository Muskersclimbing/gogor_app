import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

/**
 * Results Screen - Resultados de la sesión
 * 
 * Muestra:
 * - Estadísticas de la sesión completada
 * - Fuerza máxima y promedio
 * - Tiempo total
 * - Opciones para jugar de nuevo o volver al inicio
 */
export default function ResultsScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    maxForce?: string;
    avgForce?: string;
    timeElapsed?: string;
    fruitsCollected?: string;
    completed?: string;
  }>();

  const modeNames: Record<string, string> = {
    quick: "Calentamiento Rápido",
    total: "Calentamiento Total",
    resistance: "Resistencia",
  };

  const modeName = modeNames[params.mode || "quick"] || "Calentamiento";
  const maxForce = parseFloat(params.maxForce || "0");
  const avgForce = parseFloat(params.avgForce || "0");
  const timeElapsed = parseInt(params.timeElapsed || "0", 10);
  const fruitsCollected = parseInt(params.fruitsCollected || "0", 10);
  const wasCompleted = params.completed === "true";
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;

  const handlePlayAgainPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/mode-select");
  };

  const handleHomePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/");
  };

  return (
    <ScreenContainer className="flex-1 p-6 justify-center">
      {/* Título */}
      <View className="items-center mb-8">
        <Text className="text-5xl mb-4">🎉</Text>
        <Text className="text-3xl font-bold text-foreground text-center">
          ¡Sesión completada!
        </Text>
        <Text className="text-primary text-lg font-semibold text-center mt-2">
          {modeName}
        </Text>
        <Text className="text-muted text-center mt-1">
          {minutes}:{String(seconds).padStart(2, "0")} minutos
        </Text>
      </View>

      {/* Estadísticas */}
      <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
        <Text className="text-foreground font-semibold text-lg mb-4">Estadísticas</Text>
        
        <View className="gap-3">
          <View className="flex-row justify-between">
            <Text className="text-muted">Fuerza máxima</Text>
            <Text className="text-foreground font-semibold">{maxForce.toFixed(1)} kg</Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-muted">Fuerza promedio</Text>
            <Text className="text-foreground font-semibold">{avgForce.toFixed(1)} kg</Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-muted">Tiempo total</Text>
            <Text className="text-foreground font-semibold">{minutes}:{String(seconds).padStart(2, "0")} min</Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-muted">Frutas recogidas</Text>
            <Text className="text-foreground font-semibold">{fruitsCollected}</Text>
          </View>
        </View>
      </View>

      {/* Mensaje motivacional - solo si completó el ejercicio */}
      {wasCompleted && (
        <View className="bg-success/10 border border-success/30 rounded-2xl p-4 mb-6">
          <Text className="text-success text-center font-medium">
            ✓ Excelente trabajo. Tus dedos están listos para escalar.
          </Text>
        </View>
      )}

      {/* Botones */}
      <View className="gap-3">
        <TouchableOpacity
          onPress={handlePlayAgainPress}
          className="bg-primary px-6 py-4 rounded-xl active:opacity-80"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-background text-lg font-semibold text-center">
            Nueva sesión
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleHomePress}
          className="bg-surface border border-border px-6 py-3 rounded-xl active:opacity-70"
        >
          <Text className="text-foreground text-center font-medium">
            Volver al inicio
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
