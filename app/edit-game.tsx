import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  customGamesService,
  type ForcezoneConfig,
  type CustomGame,
} from "@/lib/custom-games-service";

export default function EditGameScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ gameId?: string }>();

  const [game, setGame] = useState<CustomGame | null>(null);
  const [name, setName] = useState("");
  const [minutesInput, setMinutesInput] = useState("3");
  const [secondsInput, setSecondsInput] = useState("0");
  const [extension, setExtension] = useState("33");
  const [semiArqueo, setSemiArqueo] = useState("33");
  const [arqueo, setArqueo] = useState("34");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadGame = async () => {
      if (!params.gameId) {
        Alert.alert("Error", "No se especificó el juego a editar");
        router.back();
        return;
      }

      const loadedGame = await customGamesService.getGameById(params.gameId);
      if (!loadedGame) {
        Alert.alert("Error", "No se encontró el juego");
        router.back();
        return;
      }

      setGame(loadedGame);
      setName(loadedGame.name);

      const minutes = Math.floor(loadedGame.duration / 60);
      const seconds = loadedGame.duration % 60;
      setMinutesInput(minutes.toString());
      setSecondsInput(seconds.toString());

      setExtension(loadedGame.forcezones.extension.toString());
      setSemiArqueo(loadedGame.forcezones.semiArqueo.toString());
      setArqueo(loadedGame.forcezones.arqueo.toString());
    };

    loadGame();
  }, [params.gameId, router]);

  const validateInputs = (): boolean => {
    if (!name.trim()) {
      Alert.alert("Error", "Por favor ingresa un nombre para el juego");
      return false;
    }

    const minutes = parseInt(minutesInput) || 0;
    const seconds = parseInt(secondsInput) || 0;
    const duration = minutes * 60 + seconds;

    if (duration <= 0) {
      Alert.alert("Error", "La duración debe ser mayor a 0");
      return false;
    }

    const ext = parseInt(extension) || 0;
    const semi = parseInt(semiArqueo) || 0;
    const arq = parseInt(arqueo) || 0;

    if (ext < 0 || semi < 0 || arq < 0) {
      Alert.alert("Error", "Los porcentajes no pueden ser negativos");
      return false;
    }

    if (ext + semi + arq !== 100) {
      Alert.alert(
        "Error",
        `Los porcentajes deben sumar 100% (actualmente: ${ext + semi + arq}%)`,
      );
      return false;
    }

    return true;
  };

  const handleSaveGame = async () => {
    if (!validateInputs() || !game) return;

    setLoading(true);
    try {
      const minutes = parseInt(minutesInput) || 0;
      const seconds = parseInt(secondsInput) || 0;
      const forcezones: ForcezoneConfig = {
        extension: parseInt(extension) || 0,
        semiArqueo: parseInt(semiArqueo) || 0,
        arqueo: parseInt(arqueo) || 0,
      };

      await customGamesService.updateGame(
        game.id,
        name,
        minutes,
        seconds,
        forcezones,
      );

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert("Éxito", "Juego actualizado correctamente", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el juego");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = () => {
    if (!game) return;

    Alert.alert(
      "Eliminar juego",
      `¿Estás seguro de que quieres eliminar "${game.name}"?`,
      [
        {
          text: "Cancelar",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Eliminar",
          onPress: async () => {
            setLoading(true);
            try {
              await customGamesService.deleteGame(game.id);

              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              }

              Alert.alert("Éxito", "Juego eliminado correctamente", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el juego");
              console.error(error);
            } finally {
              setLoading(false);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleCancel = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const updatePercentage = (field: string, value: string) => {
    const num = parseInt(value) || 0;
    const clamped = Math.max(0, Math.min(100, num));

    if (field === "extension") setExtension(clamped.toString());
    else if (field === "semiArqueo") setSemiArqueo(clamped.toString());
    else if (field === "arqueo") setArqueo(clamped.toString());
  };

  const total =
    (parseInt(extension) || 0) +
    (parseInt(semiArqueo) || 0) +
    (parseInt(arqueo) || 0);
  const totalColor = total === 100 ? colors.success : colors.error;

  if (!game) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-foreground">Cargando...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 p-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Título */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Editar Juego
          </Text>
          <Text className="text-muted text-sm">
            Modifica tu entrenamiento personalizado
          </Text>
        </View>

        {/* Nombre */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-2">Nombre</Text>
          <TextInput
            placeholder="Ej: Entrenamiento de fuerza"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            editable={!loading}
          />
        </View>

        {/* Tiempo de partida */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-2">
            Tiempo de partida
          </Text>
          <View className="flex-row gap-2 items-center justify-center">
            <View className="flex-1">
              <TextInput
                placeholder="0"
                placeholderTextColor={colors.muted}
                value={minutesInput}
                onChangeText={setMinutesInput}
                keyboardType="number-pad"
                maxLength={3}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-center text-lg"
                editable={!loading}
              />
              <Text className="text-muted text-xs text-center mt-1">Min.</Text>
            </View>

            <Text className="text-foreground text-2xl font-bold">:</Text>

            <View className="flex-1">
              <TextInput
                placeholder="0"
                placeholderTextColor={colors.muted}
                value={secondsInput}
                onChangeText={setSecondsInput}
                keyboardType="number-pad"
                maxLength={2}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-center text-lg"
                editable={!loading}
              />
              <Text className="text-muted text-xs text-center mt-1">Seg.</Text>
            </View>
          </View>
        </View>

        {/* Zonas de Fuerza */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-2">
            Zonas de Fuerza
          </Text>
          <Text className="text-muted text-xs mb-4">
            Define el porcentaje de tiempo de partida que quieres transcurrir en
            cada segmento de carga
          </Text>

          {/* Extensión */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-foreground font-medium">Extensión</Text>
              <Text className="text-muted text-xs">0-35%</Text>
            </View>
            <TextInput
              placeholder="0"
              placeholderTextColor={colors.muted}
              value={extension}
              onChangeText={(val) => updatePercentage("extension", val)}
              keyboardType="number-pad"
              maxLength={3}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-center"
              editable={!loading}
            />
          </View>

          {/* Semi-arqueo */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-foreground font-medium">Semi-arqueo</Text>
              <Text className="text-muted text-xs">35-70%</Text>
            </View>
            <TextInput
              placeholder="0"
              placeholderTextColor={colors.muted}
              value={semiArqueo}
              onChangeText={(val) => updatePercentage("semiArqueo", val)}
              keyboardType="number-pad"
              maxLength={3}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-center"
              editable={!loading}
            />
          </View>

          {/* Arqueo */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-foreground font-medium">Arqueo</Text>
              <Text className="text-muted text-xs">70-100%</Text>
            </View>
            <TextInput
              placeholder="0"
              placeholderTextColor={colors.muted}
              value={arqueo}
              onChangeText={(val) => updatePercentage("arqueo", val)}
              keyboardType="number-pad"
              maxLength={3}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-center"
              editable={!loading}
            />
          </View>

          {/* Total */}
          <View className="bg-surface border border-border rounded-lg p-3 mt-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-muted">Total</Text>
              <Text className="text-lg font-bold" style={{ color: totalColor }}>
                {total}%
              </Text>
            </View>
          </View>
        </View>

        {/* Botones */}
        <View className="gap-3 mt-auto">
          <TouchableOpacity
            onPress={handleSaveGame}
            disabled={loading}
            className="bg-primary px-6 py-4 rounded-xl active:opacity-80"
            style={{
              backgroundColor: colors.primary,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Text className="text-background text-lg font-semibold text-center">
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteGame}
            disabled={loading}
            className="bg-error/10 border border-error/30 px-6 py-3 rounded-xl active:opacity-70"
          >
            <Text className="text-error text-center font-medium">
              Eliminar Juego
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCancel}
            disabled={loading}
            className="bg-surface border border-border px-6 py-3 rounded-xl active:opacity-70"
          >
            <Text className="text-foreground text-center font-medium">
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
