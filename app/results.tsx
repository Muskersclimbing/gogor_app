import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

/**
 * Results Screen - Resultados de la partida
 * 
 * Muestra:
 * - Puntuación final
 * - Estadísticas de la partida
 * - Opciones para jugar de nuevo o volver al inicio
 */
export default function ResultsScreen() {
  const colors = useColors();
  const router = useRouter();

  // TODO: Recibir datos reales de la partida en Fase 4
  const results = {
    score: 850,
    avgForce: 24.3,
    maxForce: 32.5,
    accuracy: 87, // % dentro del objetivo
    duration: 15, // segundos
  };

  const handlePlayAgainPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.back(); // Volver a la pantalla del juego
  };

  const handleHomePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/"); // Volver al inicio
  };

  return (
    <ScreenContainer className="flex-1 p-6 justify-center">
      {/* Título */}
      <View className="items-center mb-8">
        <Text className="text-4xl mb-4">🏆</Text>
        <Text className="text-3xl font-bold text-foreground text-center">
          ¡Partida completada!
        </Text>
      </View>

      {/* Puntuación principal */}
      <View className="bg-primary rounded-3xl p-8 mb-6 items-center">
        <Text className="text-background text-lg mb-2">Puntuación</Text>
        <Text className="text-background text-6xl font-bold">
          {results.score}
        </Text>
        <Text className="text-background text-lg mt-2">puntos</Text>
      </View>

      {/* Estadísticas */}
      <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
        <Text className="text-foreground text-xl font-semibold mb-4">
          Estadísticas
        </Text>

        <View className="gap-3">
          <StatRow
            label="Fuerza promedio"
            value={`${results.avgForce.toFixed(1)} kg`}
          />
          <StatRow
            label="Fuerza máxima"
            value={`${results.maxForce.toFixed(1)} kg`}
          />
          <StatRow
            label="Precisión"
            value={`${results.accuracy}%`}
            highlight={results.accuracy >= 80}
          />
          <StatRow
            label="Duración"
            value={`${results.duration}s`}
          />
        </View>
      </View>

      {/* Botones */}
      <View className="gap-3">
        <TouchableOpacity
          onPress={handlePlayAgainPress}
          className="bg-primary px-6 py-4 rounded-xl active:opacity-80"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-background text-lg font-semibold text-center">
            Jugar de nuevo
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

// Componente auxiliar para las filas de estadísticas
function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-muted text-base">{label}</Text>
      <Text
        className={`text-lg font-semibold ${highlight ? "text-success" : "text-foreground"}`}
      >
        {value}
      </Text>
    </View>
  );
}
