import React, { useEffect, useRef, useState } from "react";
import { View, Dimensions, Image, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Constantes de física
const GRAVITY = 0.6;
const FORCE_MULTIPLIER = 0.15;
const BIRD_SIZE = 50;
const OBSTACLE_WIDTH = 60;
const GAP_HEIGHT = 180;
const SCROLL_SPEED = 3;
const FRUIT_SIZE = 40;

// Tipos de frutos
const FRUIT_TYPES = [
  "watermelon",
  "banana",
  "apple",
  "orange",
  "strawberry",
  "cherry",
  "peach",
  "pear",
] as const;

type FruitType = (typeof FRUIT_TYPES)[number];

interface Fruit {
  id: string;
  x: number;
  y: number;
  type: FruitType;
  collected: boolean;
}

interface Obstacle {
  id: string;
  x: number;
  gapY: number;
  passed: boolean;
}

interface FlappyBirdGameProps {
  currentForce: number;
  lowZone: number;
  midZone: number;
  highZone: number;
  onFruitCollected: () => void;
  onCollision: () => void;
  isPaused: boolean;
}

export function FlappyBirdGame({
  currentForce,
  lowZone,
  midZone,
  highZone,
  onFruitCollected,
  onCollision,
  isPaused,
}: FlappyBirdGameProps) {
  // Posición del pájaro
  const birdY = useSharedValue(SCREEN_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const birdRotation = useSharedValue(0);

  // Estado del juego
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const gameLoopRef = useRef<any>(null);
  const obstacleCounterRef = useRef(0);
  const fruitCounterRef = useRef(0);

  // Generar obstáculo
  const generateObstacle = () => {
    const minGapY = 100;
    const maxGapY = SCREEN_HEIGHT - GAP_HEIGHT - 100;
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

    return {
      id: `obstacle-${obstacleCounterRef.current++}`,
      x: SCREEN_WIDTH + 50,
      gapY,
      passed: false,
    };
  };

  // Generar fruto
  const generateFruit = () => {
    const minY = 80;
    const maxY = SCREEN_HEIGHT - 150;
    const y = Math.random() * (maxY - minY) + minY;
    const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];

    return {
      id: `fruit-${fruitCounterRef.current++}`,
      x: SCREEN_WIDTH + 100,
      y,
      type,
      collected: false,
    };
  };

  // Inicializar obstáculos y frutos
  useEffect(() => {
    const initialObstacles = [
      { ...generateObstacle(), x: SCREEN_WIDTH + 200 },
      { ...generateObstacle(), x: SCREEN_WIDTH + 500 },
      { ...generateObstacle(), x: SCREEN_WIDTH + 800 },
    ];
    setObstacles(initialObstacles);

    const initialFruits = [
      { ...generateFruit(), x: SCREEN_WIDTH + 300 },
      { ...generateFruit(), x: SCREEN_WIDTH + 600 },
      { ...generateFruit(), x: SCREEN_WIDTH + 900 },
    ];
    setFruits(initialFruits);
  }, []);

  // Game loop
  useEffect(() => {
    if (isPaused) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      // Física del pájaro
      const forceEffect = currentForce > lowZone ? (currentForce - lowZone) * FORCE_MULTIPLIER : 0;
      birdVelocity.current += GRAVITY - forceEffect;
      
      // Limitar velocidad
      birdVelocity.current = Math.max(-10, Math.min(10, birdVelocity.current));
      
      const newBirdY = birdY.value + birdVelocity.current;
      
      // Limitar posición del pájaro
      if (newBirdY < 0) {
        birdY.value = 0;
        birdVelocity.current = 0;
      } else if (newBirdY > SCREEN_HEIGHT - BIRD_SIZE - 100) {
        birdY.value = SCREEN_HEIGHT - BIRD_SIZE - 100;
        birdVelocity.current = 0;
      } else {
        birdY.value = newBirdY;
      }

      // Rotación del pájaro según velocidad
      birdRotation.value = withTiming(
        Math.max(-30, Math.min(30, birdVelocity.current * 3)),
        { duration: 100 }
      );

      // Mover obstáculos
      setObstacles((prev) => {
        const updated = prev.map((obs) => ({
          ...obs,
          x: obs.x - SCROLL_SPEED,
        }));

        // Detectar colisiones con obstáculos
        const birdX = 100;
        updated.forEach((obs) => {
          if (
            birdX + BIRD_SIZE > obs.x &&
            birdX < obs.x + OBSTACLE_WIDTH &&
            (birdY.value < obs.gapY || birdY.value + BIRD_SIZE > obs.gapY + GAP_HEIGHT)
          ) {
            onCollision();
          }
        });

        // Eliminar obstáculos fuera de pantalla y generar nuevos
        const filtered = updated.filter((obs) => obs.x > -OBSTACLE_WIDTH);
        if (filtered.length < 3) {
          filtered.push(generateObstacle());
        }

        return filtered;
      });

      // Mover frutos
      setFruits((prev) => {
        const updated = prev.map((fruit) => ({
          ...fruit,
          x: fruit.x - SCROLL_SPEED,
        }));

        // Detectar colisión con frutos
        const birdX = 100;
        updated.forEach((fruit) => {
          if (
            !fruit.collected &&
            Math.abs(birdX + BIRD_SIZE / 2 - fruit.x - FRUIT_SIZE / 2) < 40 &&
            Math.abs(birdY.value + BIRD_SIZE / 2 - fruit.y - FRUIT_SIZE / 2) < 40
          ) {
            fruit.collected = true;
            onFruitCollected();
          }
        });

        // Eliminar frutos fuera de pantalla y generar nuevos
        const filtered = updated.filter((fruit) => fruit.x > -FRUIT_SIZE);
        if (filtered.length < 4) {
          filtered.push(generateFruit());
        }

        return filtered;
      });
    }, 1000 / 60); // 60 FPS

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [currentForce, lowZone, isPaused, birdY, onFruitCollected, onCollision]);

  // Estilo animado del pájaro
  const birdAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: birdY.value },
      { rotate: `${birdRotation.value}deg` },
    ],
  }));

  // Color del pájaro según zona de fuerza
  const getBirdColor = () => {
    if (currentForce >= highZone) return "#EF4444"; // Rojo
    if (currentForce >= midZone) return "#F59E0B"; // Amarillo
    return "#10B981"; // Verde
  };

  // Color del fruto según tipo
  const getFruitColor = (type: FruitType) => {
    const colors: Record<FruitType, string> = {
      watermelon: "#FF6B6B",
      banana: "#FFD93D",
      apple: "#FF4757",
      orange: "#FFA502",
      strawberry: "#FF6348",
      cherry: "#C23616",
      peach: "#FFBE76",
      pear: "#95E1D3",
    };
    return colors[type];
  };

  return (
    <View style={styles.container}>
      {/* Pájaro */}
      <Animated.View style={[styles.bird, birdAnimatedStyle]}>
        <View style={[styles.birdBody, { backgroundColor: getBirdColor() }]} />
      </Animated.View>

      {/* Obstáculos */}
      {obstacles.map((obstacle) => (
        <View key={obstacle.id}>
          {/* Obstáculo superior */}
          <View
            style={[
              styles.obstacle,
              {
                left: obstacle.x,
                top: 0,
                height: obstacle.gapY,
              },
            ]}
          />
          {/* Obstáculo inferior */}
          <View
            style={[
              styles.obstacle,
              {
                left: obstacle.x,
                top: obstacle.gapY + GAP_HEIGHT,
                height: SCREEN_HEIGHT - obstacle.gapY - GAP_HEIGHT,
              },
            ]}
          />
        </View>
      ))}

      {/* Frutos */}
      {fruits.map((fruit) =>
        !fruit.collected ? (
          <View
            key={fruit.id}
            style={[
              styles.fruit,
              {
                left: fruit.x,
                top: fruit.y,
                backgroundColor: getFruitColor(fruit.type),
              },
            ]}
          />
        ) : null
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  bird: {
    position: "absolute",
    left: 100,
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    zIndex: 10,
  },
  birdBody: {
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    borderRadius: BIRD_SIZE / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  obstacle: {
    position: "absolute",
    width: OBSTACLE_WIDTH,
    backgroundColor: "#8B7355",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#5C4A3A",
  },
  fruit: {
    position: "absolute",
    width: FRUIT_SIZE,
    height: FRUIT_SIZE,
    borderRadius: FRUIT_SIZE / 2,
    zIndex: 5,
  },
});
