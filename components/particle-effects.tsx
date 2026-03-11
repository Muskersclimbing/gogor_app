import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
} from "react-native-reanimated";

interface ParticleEffectsProps {
  zone: "low" | "medium" | "high" | "none";
  isPlaying: boolean;
}

interface ParticleDotProps {
  color: string;
  index: number;
  intensity: number;
  duration: number;
  isVisible: boolean;
}

function ParticleDot({
  color,
  index,
  intensity,
  duration,
  isVisible,
}: ParticleDotProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!isVisible) {
      opacity.value = withTiming(0);
      translateY.value = withTiming(0);
      translateX.value = withTiming(0);
      return;
    }

    const delay = index * 200;

    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(intensity, { duration: duration / 2 }), -1, true),
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        false,
      ),
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming((index - 2) * 20, { duration: duration * 0.7 }),
        -1,
        true,
      ),
    );
  }, [duration, index, intensity, isVisible, opacity, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.particle, { backgroundColor: color }, animatedStyle]}
    />
  );
}

export function ParticleEffects({ zone, isPlaying }: ParticleEffectsProps) {
  const isVisible = isPlaying && zone !== "none";

  const getParticleColor = () => {
    switch (zone) {
      case "low":
        return "#4ADE80"; // verde
      case "medium":
        return "#FBBF24"; // amarillo
      case "high":
        return "#F87171"; // rojo
      default:
        return "#FFFFFF";
    }
  };

  const particleColor = getParticleColor();
  const intensity = zone === "high" ? 1 : zone === "medium" ? 0.6 : 0.3;
  const duration = zone === "high" ? 800 : zone === "medium" ? 1200 : 1600;

  return (
    <View style={styles.container}>
      {Array.from({ length: 5 }, (_, index) => (
        <ParticleDot
          key={index}
          color={particleColor}
          duration={duration}
          index={index}
          intensity={intensity}
          isVisible={isVisible}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: "50%",
    marginLeft: -50,
    width: 100,
    height: 100,
    zIndex: 5,
  },
  particle: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    left: "50%",
    bottom: 0,
    marginLeft: -6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
