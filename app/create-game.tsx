import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  customGamesService,
  type ForcezoneConfig,
} from "@/lib/custom-games-service";

export default function CreateGameScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [minutesInput, setMinutesInput] = useState("3");
  const [secondsInput, setSecondsInput] = useState("0");
  const [extension, setExtension] = useState("33");
  const [semiArqueo, setSemiArqueo] = useState("33");
  const [arqueo, setArqueo] = useState("34");
  const [loading, setLoading] = useState(false);

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
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const minutes = parseInt(minutesInput) || 0;
      const seconds = parseInt(secondsInput) || 0;
      const forcezones: ForcezoneConfig = {
        extension: parseInt(extension) || 0,
        semiArqueo: parseInt(semiArqueo) || 0,
        arqueo: parseInt(arqueo) || 0,
      };

      await customGamesService.createGame(name, minutes, seconds, forcezones);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(t("common.success"), t("customGame.success.created"), [
        {
          text: t("common.ok"),
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(t("common.error"), t("customGame.errors.createFailed"));
      console.error(error);
    } finally {
      setLoading(false);
    }
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

  return (
    <ScreenContainer className="flex-1 p-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">
            {t("customGame.createTitle")}
          </Text>
          <Text className="text-muted text-sm">
            {t("customGame.createSubtitle")}
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
              {loading ? t("common.saving") : t("customGame.saveGame")}
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
