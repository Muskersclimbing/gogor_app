import { useEffect, useRef, useState } from "react";
import { View, Dimensions, Image, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Constantes de física
const GRAVITY = 0.6; // Gravedad que hace caer al pájaro
const FORCE_MULTIPLIER = 1.5; // Multiplicador de fuerza (mayor = más sensible)
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
  // Posición del pájaro (usar useState en lugar de Shared Value)
  const [birdY, setBirdY] = useState(SCREEN_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const birdRotation = useSharedValue(0);

  // Estado del juego
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const gameLoopRef = useRef<any>(null);
  const obstacleCounterRef = useRef(0);
  const fruitCounterRef = useRef(0);
  const hasCollidedRef = useRef(false);

  // Función para generar obstáculo
  const generateObstacle = (): Obstacle => {
    obstacleCounterRef.current += 1;
    const gapY = Math.random() * (SCREEN_HEIGHT - GAP_HEIGHT - 200) + 100;
    return {
      id: `obstacle-${obstacleCounterRef.current}`,
      x: SCREEN_WIDTH,
      gapY,
      passed: false,
    };
  };

  // Función para generar fruto
  const generateFruit = (): Fruit => {
    fruitCounterRef.current += 1;
    const randomType = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    return {
      id: `fruit-${fruitCounterRef.current}`,
      x: SCREEN_WIDTH,
      y: Math.random() * (SCREEN_HEIGHT - FRUIT_SIZE - 200) + 100,
      type: randomType,
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
      // Aplicar gravedad (siempre cae)
      birdVelocity.current += GRAVITY;
      
      // Si hay fuerza, contrarrestar gravedad y subir
      if (currentForce > lowZone) {
        const upwardForce = (currentForce - lowZone) * FORCE_MULTIPLIER;
        birdVelocity.current -= upwardForce; // Restar para subir (negativo = arriba)
      }
      
      // Limitar velocidad
      birdVelocity.current = Math.max(-15, Math.min(15, birdVelocity.current));
      
      // Calcular nueva posición
      setBirdY((prevY) => {
        let newY = prevY + birdVelocity.current;
        
        // Limitar posición del pájaro
        if (newY < 0) {
          newY = 0;
          birdVelocity.current = 0;
        } else if (newY > SCREEN_HEIGHT - BIRD_SIZE - 100) {
          newY = SCREEN_HEIGHT - BIRD_SIZE - 100;
          birdVelocity.current = 0;
        }
        
        return newY;
      });

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
            birdX < obs.x + OBSTACLE_WIDTH
          ) {
            // Comprobar si el pájaro está fuera del hueco
            setBirdY((currentBirdY) => {
              if (
                currentBirdY < obs.gapY ||
                currentBirdY + BIRD_SIZE > obs.gapY + GAP_HEIGHT
              ) {
                if (!hasCollidedRef.current) {
                  hasCollidedRef.current = true;
                  onCollision();
                }
              }
              return currentBirdY;
            });
          }
        });

        // Generar nuevo obstáculo si el último está lejos
        if (updated.length > 0 && updated[updated.length - 1].x < SCREEN_WIDTH - 300) {
          updated.push(generateObstacle());
        }

        // Eliminar obstáculos fuera de pantalla
        return updated.filter((obs) => obs.x > -OBSTACLE_WIDTH);
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
            birdX + BIRD_SIZE > fruit.x &&
            birdX < fruit.x + FRUIT_SIZE
          ) {
            setBirdY((currentBirdY) => {
              if (
                currentBirdY + BIRD_SIZE > fruit.y &&
                currentBirdY < fruit.y + FRUIT_SIZE
              ) {
                fruit.collected = true;
                onFruitCollected();
              }
              return currentBirdY;
            });
          }
        });

        // Generar nuevo fruto si el último está lejos
        if (updated.length > 0 && updated[updated.length - 1].x < SCREEN_WIDTH - 400) {
          updated.push(generateFruit());
        }

        // Eliminar frutos fuera de pantalla o recogidos
        return updated.filter((fruit) => fruit.x > -FRUIT_SIZE && !fruit.collected);
      });
    }, 16); // ~60 FPS

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
        { rotate: `${birdRotation.value}deg` },
      ],
    };
  });

  return (
    <View style={styles.container}>
      {/* Pájaro */}
      <Animated.View
        style={[
          styles.bird,
          birdAnimatedStyle,
          {
            top: birdY,
            left: 100,
            backgroundColor: getBirdColor(),
          },
        ]}
      >
        <Image
          source={require("../assets/sprites/bird.png")}
          style={{ width: BIRD_SIZE, height: BIRD_SIZE }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Obstáculos */}
      {obstacles.map((obs) => (
        <View key={obs.id}>
          {/* Obstáculo superior */}
          <View
            style={[
              styles.obstacle,
              {
                left: obs.x,
                top: 0,
                height: obs.gapY,
              },
            ]}
          />
          {/* Obstáculo inferior */}
          <View
            style={[
              styles.obstacle,
              {
                left: obs.x,
                top: obs.gapY + GAP_HEIGHT,
                height: SCREEN_HEIGHT - obs.gapY - GAP_HEIGHT,
              },
            ]}
          />
        </View>
      ))}

      {/* Frutos */}
      {fruits.map((fruit) => (
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
                ? require("../assets/sprites/watermelon.png")
                : fruit.type === "banana"
                ? require("../assets/sprites/banana.png")
                : fruit.type === "apple"
                ? require("../assets/sprites/apple.png")
                : fruit.type === "orange"
                ? require("../assets/sprites/orange.png")
                : fruit.type === "strawberry"
                ? require("../assets/sprites/strawberry.png")
                : fruit.type === "cherry"
                ? require("../assets/sprites/cherry.png")
                : fruit.type === "peach"
                ? require("../assets/sprites/peach.png")
                : require("../assets/sprites/pear.png")
            }
            style={{ width: FRUIT_SIZE, height: FRUIT_SIZE }}
            resizeMode="contain"
          />
        </View>
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
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    borderRadius: BIRD_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  obstacle: {
    position: "absolute",
    width: OBSTACLE_WIDTH,
    backgroundColor: "#8B4513",
    borderRadius: 8,
  },
  fruit: {
    position: "absolute",
    width: FRUIT_SIZE,
    height: FRUIT_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
});
