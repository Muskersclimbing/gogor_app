import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getModeLabel } from "@/i18n/helpers";

export default function ResultsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    mode?: string;
    maxForce?: string;
    avgForce?: string;
    timeElapsed?: string;
    fruitsCollected?: string;
    completed?: string;
  }>();

  const modeName = getModeLabel(t, params.mode);
  const maxForce = parseFloat(params.maxForce || "0");
  const avgForce = parseFloat(params.avgForce || "0");
  const timeElapsed = parseInt(params.timeElapsed || "0", 10);
  const fruitsCollected = parseInt(params.fruitsCollected || "0", 10);
  const wasCompleted = params.completed === "true";
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  const paddedSeconds = String(seconds).padStart(2, "0");

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
      <View className="items-center mb-8">
        <Text className="text-5xl mb-4">🎉</Text>
        <Text className="text-3xl font-bold text-foreground text-center">
          {t("results.completed")}
        </Text>
        <Text className="text-primary text-lg font-semibold text-center mt-2">
          {modeName}
        </Text>
        <Text className="text-muted text-center mt-1">
          {t("results.durationDisplay", {
            minutes,
            seconds: paddedSeconds,
          })}
        </Text>
      </View>

      <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
        <Text className="text-foreground font-semibold text-lg mb-4">
          {t("results.stats")}
        </Text>

        <View className="gap-3">
          <View className="flex-row justify-between">
            <Text className="text-muted">{t("results.maxForce")}</Text>
            <Text className="text-foreground font-semibold">
              {t("results.forceValue", { value: maxForce.toFixed(1) })}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-muted">{t("results.avgForce")}</Text>
            <Text className="text-foreground font-semibold">
              {t("results.forceValue", { value: avgForce.toFixed(1) })}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-muted">{t("results.totalTime")}</Text>
            <Text className="text-foreground font-semibold">
              {t("results.durationShort", {
                minutes,
                seconds: paddedSeconds,
              })}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-muted">{t("results.fruitsCollected")}</Text>
            <Text className="text-foreground font-semibold">
              {fruitsCollected}
            </Text>
          </View>
        </View>
      </View>

      {wasCompleted && (
        <View className="bg-success/10 border border-success/30 rounded-2xl p-4 mb-6">
          <Text className="text-success text-center font-medium">
            {t("results.successMessage")}
          </Text>
        </View>
      )}

      <View className="gap-3">
        <TouchableOpacity
          onPress={handlePlayAgainPress}
          className="bg-primary px-6 py-4 rounded-xl active:opacity-80"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-background text-lg font-semibold text-center">
            {t("results.playAgain")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleHomePress}
          className="bg-surface border border-border px-6 py-3 rounded-xl active:opacity-70"
        >
          <Text className="text-foreground text-center font-medium">
            {t("results.home")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
