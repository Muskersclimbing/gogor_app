import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();

  const handleStartPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/mode-select");
  };

  return (
    <ScreenContainer className="flex-1 justify-center items-center p-6">
      <View className="items-center mb-12">
        <Text className="text-5xl font-bold text-primary mb-2">🦅</Text>
        <Text className="text-3xl font-bold text-foreground text-center">
          {t("common.appName")}
        </Text>
        <Text className="text-base text-muted text-center mt-2">
          {t("home.tagline")}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleStartPress}
        className="bg-primary px-8 py-4 rounded-2xl shadow-lg active:opacity-80 w-full max-w-sm"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-background text-lg font-semibold text-center">
          {t("home.start")}
        </Text>
      </TouchableOpacity>

      <View className="mt-8 items-center">
        <Text className="text-sm text-muted text-center">
          {t("home.bluetoothHint")}
        </Text>
      </View>
    </ScreenContainer>
  );
}
