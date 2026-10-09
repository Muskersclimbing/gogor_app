import React, {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { View, Text, Dimensions, Image } from "react-native";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedReaction,
  cancelAnimation,
  type SharedValue,
} from "react-native-reanimated";

import { getBirdX, getBirdTargetY } from "@/lib/multidevice-game";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const BIRD_SIZE = 75; // Aumentado 50% (era 50)
const OBSTACLE_WIDTH = 60;
const OBSTACLE_GAP = 200;
const OBSTACLE_SPEED = 3;

type FruitType =
  | "apple"
  | "banana"
  | "cherry"
  | "mandarin"
  | "orange"
  | "peach"
  | "pear"
  | "strawberry"
  | "watermelon";

// Mapeo de tipos de fruta a imágenes
const FRUIT_IMAGES: Record<FruitType, any> = {
  apple: require("@/assets/sprites/apple.png"),
  banana: require("@/assets/sprites/banana.png"),
  cherry: require("@/assets/sprites/cherry.png"),
  mandarin: require("@/assets/sprites/mandarin.png"),
  orange: require("@/assets/sprites/orange.png"),
  peach: require("@/assets/sprites/peach.png"),
  pear: require("@/assets/sprites/pear.png"),
  strawberry: require("@/assets/sprites/strawberry.png"),
  watermelon: require("@/assets/sprites/watermelon.png"),
};

interface Obstacle {
  id: number;
  x: number;
  gapY: number;
}

interface Fruit {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  type: FruitType;
}

function cloneObstacle(obstacle: Obstacle): Obstacle {
  return {
    id: obstacle.id,
    x: obstacle.x,
    gapY: obstacle.gapY,
  };
}

function cloneObstacles(obstacles: Obstacle[]): Obstacle[] {
  return obstacles.map(cloneObstacle);
}

function dedupeById<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function createInitialWorld() {
  const initialObstacles: Obstacle[] = [
    {
      id: 1,
      x: SCREEN_WIDTH,
      gapY: Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100,
    },
    {
      id: 2,
      x: SCREEN_WIDTH + 300,
      gapY: Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100,
    },
    {
      id: 3,
      x: SCREEN_WIDTH + 600,
      gapY: Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100,
    },
  ];
  const uniqueInitialObstacles = dedupeById(initialObstacles);

  // Generar frutas para cada obstáculo
  const initialFruits: Fruit[] = [];
  initialObstacles.forEach((obs, index) => {
    // Generar 1-2 frutas por obstáculo distribuidas libremente
    const fruitCount = 1 + Math.floor(Math.random() * 2); // 1 o 2 frutas
    for (let i = 0; i < fruitCount; i++) {
      // Posición X aleatoria en rango amplio
      const randomX = obs.x - 150 + Math.random() * 400;

      // Posición Y aleatoria en toda la pantalla (evitando bloques del obstáculo actual)
      let randomY = obs.gapY + OBSTACLE_GAP / 2; // Valor por defecto
      let attempts = 0;
      let validPosition = false;

      while (!validPosition && attempts < 10) {
        randomY = 50 + Math.random() * (SCREEN_HEIGHT - 100);

        // Verificar si está en el hueco O fuera de la zona horizontal del obstáculo
        const inGap = randomY >= obs.gapY && randomY <= obs.gapY + OBSTACLE_GAP;
        const outsideObstacleX =
          randomX < obs.x || randomX > obs.x + OBSTACLE_WIDTH;

        if (inGap || outsideObstacleX) {
          validPosition = true;
        }
        attempts++;
      }

      // Si no encontró posición válida, usar el hueco por defecto
      if (!validPosition) {
        randomY = obs.gapY + OBSTACLE_GAP / 2;
      }

      const fruitTypes: FruitType[] = [
        "apple",
        "banana",
        "cherry",
        "mandarin",
        "orange",
        "peach",
        "pear",
        "strawberry",
        "watermelon",
      ];
      const randomType =
        fruitTypes[Math.floor(Math.random() * fruitTypes.length)];

      initialFruits.push({
        id: index * 10 + i,
        x: randomX,
        y: randomY,
        collected: false,
        type: randomType,
      });
    }
  });

  return {
    obstacles: uniqueInitialObstacles,
    fruits: dedupeById(initialFruits),
  };
}

export interface GamePlayer {
  id: string;
  currentForce: number;
  highZone: number;
  color: string;
}

interface FlappyBirdGameProps {
  players: GamePlayer[];
  isPaused: boolean;
  onFruitCollected?: (count: number) => void;
  onForceStats?: (stats: {
    avgForce: number;
    maxForce: number;
    minForce: number;
  }) => void;
  onCollision?: () => void;
}

export interface FlappyBirdGameRef {
  getStats: () => { avgForce: number; maxForce: number; minForce: number };
}

function PlayerBird({
  player,
  index,
  count,
  isPaused,
  obstacles,
  register,
}: {
  player: GamePlayer;
  index: number;
  count: number;
  isPaused: boolean;
  obstacles: SharedValue<Obstacle[]>;
  register: (id: string, position: SharedValue<number>) => () => void;
}) {
  const birdY = useSharedValue(SCREEN_HEIGHT / 2);
  const x = getBirdX(index, count, SCREEN_WIDTH, BIRD_SIZE);
  useEffect(() => register(player.id, birdY), [birdY, player.id, register]);
  useEffect(() => {
    if (!isPaused)
      birdY.set(
        withTiming(
          getBirdTargetY(
            player.currentForce,
            player.highZone,
            SCREEN_HEIGHT,
            BIRD_SIZE,
          ),
          { duration: 100 },
        ),
      );
  }, [birdY, isPaused, player.currentForce, player.highZone]);
  useAnimatedReaction(
    () => birdY.get(),
    (currentY, previousY) => {
      if (previousY === null || isPaused) return;
      for (const obs of obstacles.get()) {
        if (x + BIRD_SIZE > obs.x && x < obs.x + OBSTACLE_WIDTH) {
          if (currentY < obs.gapY && previousY >= obs.gapY) {
            cancelAnimation(birdY);
            birdY.set(obs.gapY);
            return;
          }
          if (
            currentY + BIRD_SIZE > obs.gapY + OBSTACLE_GAP &&
            previousY + BIRD_SIZE <= obs.gapY + OBSTACLE_GAP
          ) {
            cancelAnimation(birdY);
            birdY.set(obs.gapY + OBSTACLE_GAP - BIRD_SIZE);
            return;
          }
        }
      }
    },
    [x, isPaused],
  );
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: birdY.get() }],
  }));
  return (
    <Animated.View
      testID={`bird-${player.id}`}
      style={[
        {
          position: "absolute",
          left: x,
          top: 0,
          width: BIRD_SIZE,
          height: BIRD_SIZE,
          zIndex: 100 + index,
        },
        style,
      ]}
    >
      <Image
        source={require("@/assets/sprites/bird.gif")}
        style={{ width: BIRD_SIZE, height: BIRD_SIZE }}
        resizeMode="contain"
      />
      {count > 1 && (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            backgroundColor: player.color,
            borderRadius: 12,
            minWidth: 24,
            padding: 3,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#111827", fontWeight: "bold" }}>
            {index + 1}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

export const FlappyBirdGame = forwardRef<
  FlappyBirdGameRef,
  FlappyBirdGameProps
>(({ players, isPaused, onFruitCollected, onForceStats, onCollision }, ref) => {
  const birdPositions = useRef(new Map<string, SharedValue<number>>());
  const registerBird = useCallback(
    (id: string, position: SharedValue<number>) => {
      birdPositions.current.set(id, position);
      return () => {
        birdPositions.current.delete(id);
      };
    },
    [],
  );
  const obstaclesShared = useSharedValue<Obstacle[]>([]);

  const [initialWorld] = useState(createInitialWorld);
  const [obstacles, setObstacles] = useState<Obstacle[]>(
    initialWorld.obstacles,
  );
  const [fruits, setFruits] = useState<Fruit[]>(initialWorld.fruits);
  const [collidingObstacleId, setCollidingObstacleId] = useState<number | null>(
    null,
  );
  const [collectedFruits, setCollectedFruits] = useState(0);

  // Tracking de fuerza
  const forceStats = useRef({ sum: 0, count: 0, max: 0, min: Infinity });
  const obstacleIdCounterRef = useRef(4);
  const fruitIdCounterRef = useRef(100);
  const obstaclesRef = useRef<Obstacle[]>(initialWorld.obstacles);
  const fruitsRef = useRef<Fruit[]>(initialWorld.fruits);
  const collectedFruitsRef = useRef(0);
  const playersRef = useRef(players);

  // Ref para trackear última colisión (evitar contar múltiples veces la misma)
  const lastCollisionObstacleId = useRef(new Map<string, number>());

  const collectSound = useAudioPlayer(
    require("@/assets/audio/fruit_collect.wav"),
  );
  const backgroundMusic = useAudioPlayer(
    require("@/assets/audio/background_music.wav"),
  );

  useEffect(() => {
    const loadSounds = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: "doNotMix",
        });
        // expo-audio exposes mutable native playback properties.
        // eslint-disable-next-line react-hooks/immutability
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.4;
        backgroundMusic.play();
      } catch (error) {
        console.log("Error loading sounds:", error);
      }
    };
    loadSounds();
  }, [backgroundMusic]);

  // Inicializar obstáculos
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  useEffect(() => {
    fruitsRef.current = fruits;
  }, [fruits]);

  useEffect(() => {
    collectedFruitsRef.current = collectedFruits;
  }, [collectedFruits]);

  useEffect(() => {
    obstaclesShared.set(cloneObstacles(dedupeById(obstacles)));
  }, [obstacles, obstaclesShared]);

  const getStats = useCallback(() => {
    const stats = forceStats.current;
    return stats.count
      ? {
          avgForce: stats.sum / stats.count,
          maxForce: stats.max,
          minForce: stats.min,
        }
      : { avgForce: 0, maxForce: 0, minForce: 0 };
  }, []);
  useImperativeHandle(ref, () => ({ getStats }), [getStats]);
  const wasPausedRef = useRef(isPaused);
  useEffect(() => {
    if (isPaused && !wasPausedRef.current) onForceStats?.(getStats());
    wasPausedRef.current = isPaused;
  }, [getStats, isPaused, onForceStats]);

  // Game loop: mover obstáculos, detectar colisiones, recoger frutas
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const activePlayers = playersRef.current;
      const birds = activePlayers.map((player, index) => ({
        id: player.id,
        x: getBirdX(index, activePlayers.length, SCREEN_WIDTH, BIRD_SIZE),
        y: birdPositions.current.get(player.id)?.get() ?? SCREEN_HEIGHT / 2,
      }));
      for (const player of activePlayers) {
        if (player.currentForce > 0) {
          const stats = forceStats.current;
          stats.sum += player.currentForce;
          stats.count++;
          stats.max = Math.max(stats.max, player.currentForce);
          stats.min = Math.min(stats.min, player.currentForce);
        }
      }
      const currentObstacles = obstaclesRef.current;
      let colliding = false;
      let collidingObsId: number | null = null;
      for (const bird of birds) {
        for (const obs of currentObstacles) {
          const birdRight = bird.x + BIRD_SIZE;
          if (
            birdRight > obs.x &&
            bird.x < obs.x + OBSTACLE_WIDTH &&
            (bird.y < obs.gapY ||
              bird.y + BIRD_SIZE > obs.gapY + OBSTACLE_GAP) &&
            birdRight < obs.x + 20
          ) {
            colliding = true;
            collidingObsId = obs.id;
            if (lastCollisionObstacleId.current.get(bird.id) !== obs.id) {
              lastCollisionObstacleId.current.set(bird.id, obs.id);
              onCollision?.();
            }
          }
        }
      }

      setCollidingObstacleId(collidingObsId);

      // Recoger frutas
      let newCollected = 0;
      let nextFruits = fruitsRef.current.map((fruit) => {
        if (!fruit.collected) {
          const collectedByBird = birds.some(
            (bird) =>
              Math.hypot(
                bird.x + BIRD_SIZE / 2 - fruit.x,
                bird.y + BIRD_SIZE / 2 - fruit.y,
              ) < 40,
          );
          if (collectedByBird) {
            newCollected++;
            return { ...fruit, collected: true };
          }
        }
        return fruit;
      });

      if (newCollected > 0) {
        const newTotal = collectedFruitsRef.current + newCollected;
        collectedFruitsRef.current = newTotal;
        setCollectedFruits(newTotal);
        onFruitCollected?.(newTotal);
        try {
          collectSound
            .seekTo(0)
            .then(() => {
              collectSound.play();
            })
            .catch((error: unknown) => {
              console.log("Error playing collect sound:", error);
            });
        } catch (error) {
          console.log("Error playing collect sound:", error);
        }
      }

      // Solo mover obstáculos si NO hay colisión frontal
      if (!colliding) {
        const movedObstacles = currentObstacles.map((obs) => ({
          ...obs,
          x: obs.x - OBSTACLE_SPEED,
        }));
        const visibleObstacles = movedObstacles.filter(
          (obs) => obs.x > -OBSTACLE_WIDTH,
        );
        const spawnedFruits: Fruit[] = [];

        if (visibleObstacles.length < 3) {
          const last = visibleObstacles[visibleObstacles.length - 1];
          if (!last || last.x < SCREEN_WIDTH - 300) {
            const gapY =
              Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100;
            const newObs = {
              id: obstacleIdCounterRef.current++,
              x: SCREEN_WIDTH,
              gapY,
            };
            visibleObstacles.push(newObs);

            const fruitCount = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < fruitCount; i++) {
              const randomX = newObs.x - 150 + Math.random() * 400;

              let randomY = newObs.gapY + OBSTACLE_GAP / 2;
              let attempts = 0;
              let validPosition = false;

              while (!validPosition && attempts < 10) {
                randomY = 50 + Math.random() * (SCREEN_HEIGHT - 100);

                const inGap =
                  randomY >= newObs.gapY &&
                  randomY <= newObs.gapY + OBSTACLE_GAP;
                const outsideObstacleX =
                  randomX < newObs.x || randomX > newObs.x + OBSTACLE_WIDTH;

                if (inGap || outsideObstacleX) {
                  validPosition = true;
                }
                attempts++;
              }

              if (!validPosition) {
                randomY = newObs.gapY + OBSTACLE_GAP / 2;
              }

              const fruitTypes: FruitType[] = [
                "apple",
                "banana",
                "cherry",
                "mandarin",
                "orange",
                "peach",
                "pear",
                "strawberry",
                "watermelon",
              ];
              const randomType =
                fruitTypes[Math.floor(Math.random() * fruitTypes.length)];

              spawnedFruits.push({
                id: fruitIdCounterRef.current++,
                x: randomX,
                y: randomY,
                collected: false,
                type: randomType,
              });
            }
          }
        }

        const uniqueVisibleObstacles = dedupeById(visibleObstacles);
        obstaclesRef.current = uniqueVisibleObstacles;
        setObstacles(uniqueVisibleObstacles);

        nextFruits = nextFruits
          .map((fruit) => ({ ...fruit, x: fruit.x - OBSTACLE_SPEED }))
          .filter((fruit) => fruit.x > -50);

        if (spawnedFruits.length > 0) {
          nextFruits = [...nextFruits, ...spawnedFruits];
        }
      }

      const uniqueFruits = dedupeById(nextFruits);
      fruitsRef.current = uniqueFruits;
      setFruits(uniqueFruits);
    }, 16);

    return () => clearInterval(interval);
  }, [collectSound, isPaused, onCollision, onFruitCollected]);

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      {/* Obstáculos */}
      {dedupeById(obstacles).map((obs) => {
        const isColliding = obs.id === collidingObstacleId;
        const obstacleColor = isColliding ? "#FF0000" : "#8B4513";
        const borderColor = isColliding ? "#CC0000" : "#654321";

        return (
          <View key={obs.id}>
            <View
              style={{
                position: "absolute",
                left: obs.x,
                top: 0,
                width: OBSTACLE_WIDTH,
                height: obs.gapY,
                backgroundColor: obstacleColor,
                borderWidth: 2,
                borderColor: borderColor,
              }}
            />
            <View
              style={{
                position: "absolute",
                left: obs.x,
                top: obs.gapY + OBSTACLE_GAP,
                width: OBSTACLE_WIDTH,
                height: SCREEN_HEIGHT - (obs.gapY + OBSTACLE_GAP),
                backgroundColor: obstacleColor,
                borderWidth: 2,
                borderColor: borderColor,
              }}
            />
          </View>
        );
      })}

      {/* Frutas */}
      {dedupeById(fruits).map((fruit) => {
        // Tamaños ajustados por tipo de fruta para mejor proporción
        const fruitSizes: Record<FruitType, number> = {
          watermelon: 40,
          apple: 35,
          orange: 35,
          peach: 35,
          pear: 35,
          banana: 38,
          mandarin: 32,
          strawberry: 32,
          cherry: 35,
        };
        const size = fruitSizes[fruit.type];
        const halfSize = size / 2;

        return (
          !fruit.collected && (
            <View
              key={fruit.id}
              style={{
                position: "absolute",
                left: fruit.x - halfSize,
                top: fruit.y - halfSize,
                width: size,
                height: size,
              }}
            >
              <Image
                source={FRUIT_IMAGES[fruit.type]}
                style={{ width: size, height: size }}
                resizeMode="contain"
              />
            </View>
          )
        );
      })}

      {players.map((player, index) => (
        <PlayerBird
          key={player.id}
          player={player}
          index={index}
          count={players.length}
          isPaused={isPaused}
          obstacles={obstaclesShared}
          register={registerBird}
        />
      ))}
    </View>
  );
});

FlappyBirdGame.displayName = "FlappyBirdGame";
