import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";

interface AnimatedBirdProps {
  force: number;
  maxForce: number;
  zone?: "low" | "medium" | "high" | "none";
}

export function AnimatedBird({ force, maxForce, zone = "none" }: AnimatedBirdProps) {
  const isPlaying = zone !== "none";
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const wingRotation = useSharedValue(0);
  const scale = useSharedValue(1);

  // Calcular posición vertical basada en la fuerza (0-100%)
  const forcePercent = maxForce > 0 ? Math.min((force / maxForce) * 100, 100) : 0;
  
  // Color del pájaro según zona
  const getBirdColor = () => {
    switch (zone) {
      case "low": return "#4ADE80"; // verde
      case "medium": return "#FBBF24"; // amarillo
      case "high": return "#F87171"; // rojo
      default: return "#FFD700"; // dorado
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      translateY.value = withSpring(0);
      rotation.value = withSpring(0);
      scale.value = withSpring(1);
      return;
    }

    // Posición vertical: más fuerza = más arriba
    // Rango: -200 (arriba) a 200 (abajo)
    const targetY = 200 - (forcePercent / 100) * 400;
    translateY.value = withSpring(targetY, {
      damping: 15,
      stiffness: 100,
    });

    // Rotación según velocidad de cambio
    const targetRotation = forcePercent > 50 ? -15 : 15;
    rotation.value = withSpring(targetRotation, {
      damping: 10,
      stiffness: 80,
    });

    // Escala según fuerza (más grande con más fuerza)
    const targetScale = 1 + (forcePercent / 100) * 0.3;
    scale.value = withSpring(targetScale, {
      damping: 12,
      stiffness: 90,
    });
  }, [force, maxForce, isPlaying]);

  // Animación de aleteo constante
  useEffect(() => {
    if (isPlaying) {
      wingRotation.value = withRepeat(
        withTiming(20, { duration: 200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      wingRotation.value = withTiming(0);
    }
  }, [isPlaying]);

  const birdStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  const leftWingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${-wingRotation.value}deg` }],
    };
  });

  const rightWingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${wingRotation.value}deg` }],
    };
  });

  const birdColor = getBirdColor();
  
  return (
    <Animated.View style={[styles.birdContainer, birdStyle]}>
      {/* Cuerpo del pájaro */}
      <View style={[styles.body, { backgroundColor: birdColor }]}>
        {/* Cabeza */}
        <View style={styles.head}>
          <View style={styles.eye} />
          <View style={styles.beak} />
        </View>

        {/* Alas */}
        <Animated.View style={[styles.wing, styles.leftWing, leftWingStyle]} />
        <Animated.View style={[styles.wing, styles.rightWing, rightWingStyle]} />

        {/* Cola */}
        <View style={styles.tail} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  birdContainer: {
    position: "absolute",
    left: "20%",
    top: "50%",
    zIndex: 10,
  },
  body: {
    width: 60,
    height: 50,
    backgroundColor: "#FFD700",
    borderRadius: 30,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  head: {
    position: "absolute",
    top: -15,
    left: 35,
    width: 30,
    height: 30,
    backgroundColor: "#FFD700",
    borderRadius: 15,
  },
  eye: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    backgroundColor: "#000",
    borderRadius: 3,
  },
  beak: {
    position: "absolute",
    top: 15,
    right: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderLeftColor: "#FF6B35",
    borderTopWidth: 5,
    borderTopColor: "transparent",
    borderBottomWidth: 5,
    borderBottomColor: "transparent",
  },
  wing: {
    position: "absolute",
    width: 35,
    height: 25,
    backgroundColor: "#FFA500",
    borderRadius: 20,
    top: 15,
  },
  leftWing: {
    left: -15,
    transformOrigin: "right center",
  },
  rightWing: {
    right: -15,
    transformOrigin: "left center",
  },
  tail: {
    position: "absolute",
    bottom: 5,
    left: -15,
    width: 0,
    height: 0,
    borderRightWidth: 20,
    borderRightColor: "#FFA500",
    borderTopWidth: 10,
    borderTopColor: "transparent",
    borderBottomWidth: 10,
    borderBottomColor: "transparent",
  },
});
