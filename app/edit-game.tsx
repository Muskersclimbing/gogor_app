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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
        Alert.alert(t("common.error"), t("customGame.errors.gameNotSpecified"));
        router.back();
        return;
      }

      const loadedGame = await customGamesService.getGameById(params.gameId);
      if (!loadedGame) {
        Alert.alert(t("common.error"), t("customGame.errors.gameNotFound"));
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
  }, [params.gameId, router, t]);

  const validateInputs = (): boolean => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("customGame.errors.nameRequired"));
      return false;
    }

    const minutes = parseInt(minutesInput) || 0;
    const seconds = parseInt(secondsInput) || 0;
    const duration = minutes * 60 + seconds;

    if (duration <= 0) {
      Alert.alert(t("common.error"), t("customGame.errors.durationRequired"));
      return false;
    }

    const ext = parseInt(extension) || 0;
    const semi = parseInt(semiArqueo) || 0;
    const arq = parseInt(arqueo) || 0;

    if (ext < 0 || semi < 0 || arq < 0) {
      Alert.alert(t("common.error"), t("customGame.errors.negativePercent"));
      return false;
    }

    if (ext + semi + arq !== 100) {
      Alert.alert(
        t("common.error"),
        t("customGame.errors.percentSum", { total: ext + semi + arq }),
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

      Alert.alert(t("common.success"), t("customGame.success.updated"), [
        {
          text: t("common.ok"),
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(t("common.error"), t("customGame.errors.updateFailed"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = () => {
    if (!game) return;

    Alert.alert(
      t("customGame.deleteConfirmTitle"),
      t("customGame.deleteConfirmMessage", { name: game.name }),
      [
        {
          text: t("common.cancel"),
          onPress: () => {},
          style: "cancel",
        },
        {
          text: t("common.delete"),
          onPress: async () => {
            setLoading(true);
            try {
              await customGamesService.deleteGame(game.id);

              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              }

              Alert.alert(t("common.success"), t("customGame.success.deleted"), [
                {
                  text: t("common.ok"),
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              Alert.alert(t("common.error"), t("customGame.errors.deleteFailed"));
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
        <Text className="text-foreground">{t("common.loading")}</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 p-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">
            {t("customGame.editTitle")}
          </Text>
          <Text className="text-muted text-sm">
            {t("customGame.editSubtitle")}
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-2">
            {t("common.name")}
          </Text>
          <TextInput
            placeholder={t("customGame.namePlaceholder")}
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            editable={!loading}
          />
        </View>

        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-2">
            {t("customGame.matchDuration")}
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
              <Text className="text-muted text-xs text-center mt-1">
                {t("customGame.minutes")}
              </Text>
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
              <Text className="text-muted text-xs text-center mt-1">
                {t("customGame.seconds")}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-2">
            {t("customGame.forceZones")}
          </Text>
          <Text className="text-muted text-xs mb-4">
            {t("customGame.forceZonesHint")}
          </Text>

          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-foreground font-medium">
                {t("modeSelect.forcezones.extension")}
              </Text>
              <Text className="text-muted text-xs">
                {t("customGame.rangeExtension")}
              </Text>
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

          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-foreground font-medium">
                {t("modeSelect.forcezones.semiArqueo")}
              </Text>
              <Text className="text-muted text-xs">
                {t("customGame.rangeSemiArqueo")}
              </Text>
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

          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-foreground font-medium">
                {t("modeSelect.forcezones.arqueo")}
              </Text>
              <Text className="text-muted text-xs">
                {t("customGame.rangeArqueo")}
              </Text>
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

          <View className="bg-surface border border-border rounded-lg p-3 mt-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-muted">{t("common.total")}</Text>
              <Text className="text-lg font-bold" style={{ color: totalColor }}>
                {total}%
              </Text>
            </View>
          </View>
        </View>

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
              {loading ? t("common.saving") : t("customGame.saveChanges")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteGame}
            disabled={loading}
            className="bg-error/10 border border-error/30 px-6 py-3 rounded-xl active:opacity-70"
          >
            <Text className="text-error text-center font-medium">
              {t("customGame.deleteGame")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCancel}
            disabled={loading}
            className="bg-surface border border-border px-6 py-3 rounded-xl active:opacity-70"
          >
            <Text className="text-foreground text-center font-medium">
              {t("common.cancel")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
