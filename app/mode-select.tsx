import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  customGamesService,
  type CustomGame,
} from "@/lib/custom-games-service";

export type GameMode = "quick" | "total";

interface ModeCardProps {
  title: string;
  duration: string;
  description: string;
  icon: string;
  mode: GameMode;
  onSelect: (mode: GameMode) => void;
}

interface CustomGameCardProps {
  game: CustomGame;
  onSelect: (game: CustomGame) => void;
  onEdit: (game: CustomGame) => void;
}

function ModeCard({
  title,
  duration,
  description,
  icon,
  mode,
  onSelect,
}: ModeCardProps) {
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

function CustomGameCard({ game, onSelect, onEdit }: CustomGameCardProps) {
  const minutes = Math.floor(game.duration / 60);
  const seconds = game.duration % 60;
  const durationStr = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSelect(game);
  };

  const handleEditPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onEdit(game);
  };

  return (
    <View className="bg-surface border-2 border-primary/30 rounded-2xl p-6 mb-4 overflow-hidden">
      <TouchableOpacity onPress={handlePress} className="active:opacity-80">
        <View className="flex-row items-center mb-3">
          <Text className="text-4xl mr-3">⚙️</Text>
          <View className="flex-1">
            <Text className="text-foreground text-xl font-bold">
              {game.name}
            </Text>
            <Text className="text-primary text-sm font-semibold">
              {durationStr}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 bg-background/50 rounded-lg p-2">
            <Text className="text-muted text-xs">Extensión</Text>
            <Text className="text-foreground font-semibold">
              {game.forcezones.extension}%
            </Text>
          </View>
          <View className="flex-1 bg-background/50 rounded-lg p-2">
            <Text className="text-muted text-xs">Semi-arqueo</Text>
            <Text className="text-foreground font-semibold">
              {game.forcezones.semiArqueo}%
            </Text>
          </View>
          <View className="flex-1 bg-background/50 rounded-lg p-2">
            <Text className="text-muted text-xs">Arqueo</Text>
            <Text className="text-foreground font-semibold">
              {game.forcezones.arqueo}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleEditPress}
        className="bg-primary/10 border border-primary/30 rounded-lg py-2 active:opacity-70"
      >
        <Text className="text-primary text-center font-medium text-sm">
          Editar
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Mode Select Screen - Selección de modalidad de juego
 *
 * Permite al usuario elegir entre:
 * - Calentamiento Rápido (3 min)
 * - Calentamiento Total (5 min)
 * - Juegos personalizados
 */
export default function ModeSelectScreen() {
  const colors = useColors();
  const router = useRouter();
  const [customGames, setCustomGames] = useState<CustomGame[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadCustomGames();
    }, []),
  );

  const loadCustomGames = async () => {
    const games = await customGamesService.getAllGames();
    setCustomGames(games);
  };

  const handleModeSelect = (mode: GameMode) => {
    // Navegar a la pantalla de conexión con el modo seleccionado
    router.push({
      pathname: "/connect",
      params: { mode },
    });
  };

  const handleCustomGameSelect = (game: CustomGame) => {
    // Navegar a la pantalla de conexión con el juego personalizado
    router.push({
      pathname: "/connect",
      params: {
        mode: "custom",
        gameId: game.id,
      },
    });
  };

  const handleEditGame = (game: CustomGame) => {
    router.push({
      pathname: "/edit-game",
      params: { gameId: game.id },
    });
  };

  const handleCreateGame = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/create-game");
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
          <TouchableOpacity
            onPress={handleBackPress}
            className="mb-4 active:opacity-70"
          >
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

        {/* Juegos Personalizados */}
        {customGames.length > 0 && (
          <View className="mt-8 mb-6">
            <Text className="text-foreground font-bold text-lg mb-4">
              Mis Entrenamientos
            </Text>
            {customGames.map((game) => (
              <CustomGameCard
                key={game.id}
                game={game}
                onSelect={handleCustomGameSelect}
                onEdit={handleEditGame}
              />
            ))}
          </View>
        )}

        {/* Botón Crear Juego Nuevo */}
        <TouchableOpacity
          onPress={handleCreateGame}
          className="bg-primary px-6 py-4 rounded-xl active:opacity-80 mb-6"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-background text-lg font-semibold text-center">
            Crear Juego Nuevo
          </Text>
        </TouchableOpacity>

        {/* Información adicional */}
        <View className="mt-6 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-foreground font-semibold mb-2">💡 Consejo</Text>
          <Text className="text-muted text-sm leading-relaxed">
            Todos los modos incluyen ejercicios isométricos (mantener),
            concéntricos (apretar) y excéntricos (soltar lentamente) para un
            calentamiento completo.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
