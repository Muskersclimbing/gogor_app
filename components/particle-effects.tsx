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

export function ParticleEffects({ zone, isPlaying }: ParticleEffectsProps) {
  // Crear 5 partículas
  const particles = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    opacity: useSharedValue(0),
    translateY: useSharedValue(0),
    translateX: useSharedValue(0),
  }));

  useEffect(() => {
    if (!isPlaying || zone === "none") {
      // Ocultar partículas
      particles.forEach((particle) => {
        particle.opacity.value = withTiming(0);
      });
      return;
    }

    // Animar partículas según zona
    const intensity = zone === "high" ? 1 : zone === "medium" ? 0.6 : 0.3;
    const duration = zone === "high" ? 800 : zone === "medium" ? 1200 : 1600;

    particles.forEach((particle, index) => {
      const delay = index * 200;

      particle.opacity.value = withDelay(
        delay,
        withRepeat(
          withTiming(intensity, { duration: duration / 2 }),
          -1,
          true
        )
      );

      particle.translateY.value = withDelay(
        delay,
        withRepeat(
          withTiming(-100, { duration, easing: Easing.inOut(Easing.ease) }),
          -1,
          false
        )
      );

      particle.translateX.value = withDelay(
        delay,
        withRepeat(
          withTiming((index - 2) * 20, { duration: duration * 0.7 }),
          -1,
          true
        )
      );
    });
  }, [zone, isPlaying]);

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

  return (
    <View style={styles.container}>
      {particles.map((particle) => {
        const animatedStyle = useAnimatedStyle(() => {
          return {
            opacity: particle.opacity.value,
            transform: [
              { translateY: particle.translateY.value },
              { translateX: particle.translateX.value },
            ],
          };
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              { backgroundColor: particleColor },
              animatedStyle,
            ]}
          />
        );
      })}
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
