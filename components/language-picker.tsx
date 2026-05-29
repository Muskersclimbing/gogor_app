import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import type { AppLanguage } from "@/i18n";

const LANGUAGES: { code: AppLanguage; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

type LanguagePickerProps = {
  className?: string;
};

export function LanguagePicker({ className }: LanguagePickerProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const handleSelect = (code: AppLanguage) => {
    if (code === language) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    void setLanguage(code);
  };

  return (
    <View className={className}>
      <Text style={[styles.label, { color: colors.muted }]}>
        {t("settings.language")}
      </Text>

      {/* Segmented track */}
      <View
        style={[
          styles.track,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {LANGUAGES.map((lang, index) => {
          const isSelected = lang.code === language;
          const isLast = index === LANGUAGES.length - 1;
          return (
            <Pressable
              key={lang.code}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={lang.label}
              onPress={() => handleSelect(lang.code)}
              style={({ pressed }) => [
                styles.segment,
                isLast ? null : styles.segmentGap,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : pressed
                      ? colors.border
                      : "transparent",
                },
              ]}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.segmentLabel,
                  { color: isSelected ? colors.background : colors.muted },
                ]}
              >
                {lang.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 10,
  },
  track: {
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    padding: 5,
  },
  segment: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentGap: {
    marginRight: 4,
  },
  flag: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 2,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
});
