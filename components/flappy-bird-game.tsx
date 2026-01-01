import React, { useState, useEffect, useRef } from "react";
import { View, Dimensions, Image, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Constantes de física
const GRAVITY = 0.8;
const FORCE_MULTIPLIER = 0.2;
const BIRD_SIZE = 50;
const OBSTACLE_WIDTH = 60;
const GAP_HEIGHT = 200;
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
  const hasCollidedRef = useRef(false);

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
    if (isPaused || hasCollidedRef.current) {
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
      birdVelocity.current = Math.max(-15, Math.min(15, birdVelocity.current));
      
      let newBirdY = birdY.value + birdVelocity.current;
      
      // Limitar posición del pájaro
      if (newBirdY < 0) {
        newBirdY = 0;
        birdVelocity.current = 0;
      } else if (newBirdY > SCREEN_HEIGHT - BIRD_SIZE - 100) {
        newBirdY = SCREEN_HEIGHT - BIRD_SIZE - 100;
        birdVelocity.current = 0;
      }
      
      // Actualizar posición directamente (sin animación para mejor respuesta)
      birdY.value = newBirdY;

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
        const currentBirdY = birdY.value;
        
        updated.forEach((obs) => {
          if (
            birdX + BIRD_SIZE > obs.x &&
            birdX < obs.x + OBSTACLE_WIDTH &&
            (currentBirdY < obs.gapY || currentBirdY + BIRD_SIZE > obs.gapY + GAP_HEIGHT)
          ) {
            if (!hasCollidedRef.current) {
              hasCollidedRef.current = true;
              onCollision();
            }
          }
        });

        // Eliminar obstáculos fuera de pantalla y generar nuevos
        const filtered = updated.filter((obs) => obs.x > -OBSTACLE_WIDTH);
        if (filtered.length < 3 && !hasCollidedRef.current) {
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
        const currentBirdY = birdY.value;
        
        updated.forEach((fruit) => {
          if (
            !fruit.collected &&
            Math.abs(birdX + BIRD_SIZE / 2 - fruit.x - FRUIT_SIZE / 2) < 40 &&
            Math.abs(currentBirdY + BIRD_SIZE / 2 - fruit.y - FRUIT_SIZE / 2) < 40
          ) {
            fruit.collected = true;
            onFruitCollected();
          }
        });

        // Eliminar frutos fuera de pantalla y generar nuevos
        const filtered = updated.filter((fruit) => fruit.x > -FRUIT_SIZE);
        if (filtered.length < 4 && !hasCollidedRef.current) {
          filtered.push(generateFruit());
        }

        return filtered;
      });
    }, 16); // 60fps

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPaused, currentForce, lowZone, onFruitCollected, onCollision]);

  // Reset collision flag when game resumes
  useEffect(() => {
    if (!isPaused) {
      hasCollidedRef.current = false;
    }
  }, [isPaused]);

  // Determinar color del pájaro según zona de fuerza
  const getBirdColor = () => {
    if (currentForce >= highZone) return "#EF4444"; // Rojo
    if (currentForce >= midZone) return "#F59E0B"; // Amarillo
    return "#22C55E"; // Verde
  };

  // Estilo animado del pájaro
  const birdAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: birdY.value },
        { rotate: `${birdRotation.value}deg` },
      ],
    };
  });

  // Función para obtener el color de cada fruto
  const getFruitColor = (type: FruitType): string => {
    const colors: Record<FruitType, string> = {
      watermelon: "#FF6B6B",
      banana: "#FFD93D",
      apple: "#FF4757",
      orange: "#FFA502",
      strawberry: "#FF6348",
      cherry: "#EE5A6F",
      peach: "#FFB8B8",
      pear: "#C7ECEE",
    };
    return colors[type];
  };

  return (
    <View style={styles.container}>
      {/* Pájaro */}
      <Animated.View
        style={[
          styles.bird,
          birdAnimatedStyle,
          { backgroundColor: getBirdColor() },
        ]}
      >
        <Image
          source={require("@/assets/sprites/bird.png")}
          style={styles.birdImage}
          resizeMode="contain"
        />
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
      {fruits.map((fruit) => (
        !fruit.collected && (
          <View
            key={fruit.id}
            style={[
              styles.fruit,
              {
                left: fruit.x,
                top: fruit.y,
              },
            ]}
          >
            <Image
              source={
                fruit.type === "watermelon"
                  ? require("@/assets/sprites/watermelon.png")
                  : fruit.type === "banana"
                  ? require("@/assets/sprites/banana.png")
                  : fruit.type === "apple"
                  ? require("@/assets/sprites/apple.png")
                  : require("@/assets/sprites/orange.png")
              }
              style={styles.fruitImage}
              resizeMode="contain"
            />
          </View>
        )
      ))}
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
    borderRadius: BIRD_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  birdImage: {
    width: BIRD_SIZE * 0.8,
    height: BIRD_SIZE * 0.8,
  },
  obstacle: {
    position: "absolute",
    width: OBSTACLE_WIDTH,
    backgroundColor: "#8B6F47",
    borderRadius: 8,
  },
  fruit: {
    position: "absolute",
    width: FRUIT_SIZE,
    height: FRUIT_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  fruitImage: {
    width: FRUIT_SIZE,
    height: FRUIT_SIZE,
  },
});
