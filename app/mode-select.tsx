import { View, Text, TouchableOpacity, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export type GameMode = "quick" | "total" | "resistance";

interface ModeCardProps {
  title: string;
  duration: string;
  description: string;
  icon: string;
  mode: GameMode;
  onSelect: (mode: GameMode) => void;
}

function ModeCard({ title, duration, description, icon, mode, onSelect }: ModeCardProps) {
  const colors = useColors();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSelect(mode);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-surface border-2 border-border rounded-2xl p-6 mb-4 active:opacity-80"
      style={{ borderColor: colors.border }}
    >
      <View className="flex-row items-center mb-3">
        <Text className="text-4xl mr-3">{icon}</Text>
        <View className="flex-1">
          <Text className="text-foreground text-xl font-bold">{title}</Text>
          <Text className="text-primary text-sm font-semibold">{duration}</Text>
        </View>
      </View>
      <Text className="text-muted text-sm leading-relaxed">{description}</Text>
    </TouchableOpacity>
  );
}

/**
 * Mode Select Screen - Selección de modalidad de juego
 * 
 * Permite al usuario elegir entre:
 * - Calentamiento Rápido (3 min)
 * - Calentamiento Total (5 min)
 * - Resistencia (3 vidas)
 */
export default function ModeSelectScreen() {
  const colors = useColors();
  const router = useRouter();

  const handleModeSelect = (mode: GameMode) => {
    // Navegar a la pantalla de conexión con el modo seleccionado
    router.push({
      pathname: "/connect",
      params: { mode },
    });
  };

  const handleBackPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <ScreenContainer className="flex-1 p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={handleBackPress} className="mb-4 active:opacity-70">
            <Text className="text-primary text-lg">← Atrás</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground mb-2">
            Elige tu modalidad
          </Text>
          <Text className="text-muted">
            Selecciona el tipo de calentamiento que quieres realizar
          </Text>
        </View>

        {/* Modo: Calentamiento Rápido */}
        <ModeCard
          title="Calentamiento Rápido"
          duration="3 minutos"
          description="Sesión corta de 3 minutos en un escenario. Ideal para un calentamiento express antes de escalar."
          icon="⚡"
          mode="quick"
          onSelect={handleModeSelect}
        />

        {/* Modo: Calentamiento Total */}
        <ModeCard
          title="Calentamiento Total"
          duration="5 minutos"
          description="Sesión completa de 5 minutos con 2 escenarios y transición nocturna. Calentamiento completo para una sesión de escalada."
          icon="🌄"
          mode="total"
          onSelect={handleModeSelect}
        />

        {/* Modo: Resistencia */}
        <ModeCard
          title="Resistencia"
          duration="3 vidas"
          description="Desafío de resistencia con 3 vidas. Recorre los 4 escenarios icónicos con transiciones nocturnas. Pierdes una vida si no mantienes la zona objetivo."
          icon="💪"
          mode="resistance"
          onSelect={handleModeSelect}
        />

        {/* Información adicional */}
        <View className="mt-6 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-foreground font-semibold mb-2">💡 Consejo</Text>
          <Text className="text-muted text-sm leading-relaxed">
            Todos los modos incluyen ejercicios isométricos (mantener), concéntricos (apretar) y excéntricos (soltar lentamente) para un calentamiento completo.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
