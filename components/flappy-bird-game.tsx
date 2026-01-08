import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { View, Dimensions, Text, Image } from "react-native";
import { Audio } from "expo-av";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useAnimatedReaction, cancelAnimation, runOnJS } from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const BIRD_SIZE = 75; // Aumentado 50% (era 50)
const BIRD_X = 50; // Posición X fija del pájaro
const OBSTACLE_WIDTH = 60;
const OBSTACLE_GAP = 200;
const OBSTACLE_SPEED = 3;

type FruitType = "apple" | "banana" | "cherry" | "mandarin" | "orange" | "peach" | "pear" | "strawberry" | "watermelon";

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

interface FlappyBirdGameProps {
  currentForce: number;
  lowZone: number;
  highZone: number;
  isPaused: boolean;
  onGameOver?: () => void;
  onFruitCollected?: (count: number) => void;
  onForceStats?: (stats: { avgForce: number; maxForce: number; minForce: number }) => void;
  onCollision?: () => void;
}

export interface FlappyBirdGameRef {
  getStats: () => { avgForce: number; maxForce: number; minForce: number };
}

export const FlappyBirdGame = forwardRef<FlappyBirdGameRef, FlappyBirdGameProps>(({
  currentForce,
  lowZone,
  highZone,
  isPaused,
  onGameOver,
  onFruitCollected,
  onForceStats,
  onCollision,
}, ref) => {
  const birdY = useSharedValue(SCREEN_HEIGHT / 2);
  const obstaclesShared = useSharedValue<Obstacle[]>([]);
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [collidingObstacleId, setCollidingObstacleId] = useState<number | null>(null);
  const [collectedFruits, setCollectedFruits] = useState(0);
  
  // Tracking de fuerza
  const forceReadings = useRef<number[]>([]);
  const maxForceRef = useRef<number>(0);
  
  // Ref para acceder a obstacles sin ponerlo en dependencias
  const obstaclesRef = useRef<Obstacle[]>([]);
  
  // Ref para trackear última colisión (evitar contar múltiples veces la misma)
  const lastCollisionObstacleId = useRef<number | null>(null);
  
  // Audio players para música de fondo y sonido de recolección
  const collectSoundRef = useRef<any>(null);
  const backgroundMusicRef = useRef<any>(null);
  
  useEffect(() => {
    const loadSounds = async () => {
      try {
        await Audio.setAudioModeAsync({ 
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
        });
        const { sound: collectSound } = await Audio.Sound.createAsync(require("@/assets/audio/fruit_collect.wav"));
        collectSoundRef.current = collectSound;
        const { sound: bgMusic } = await Audio.Sound.createAsync(require("@/assets/audio/background_music.wav"), { isLooping: true, volume: 0.4 });
        backgroundMusicRef.current = bgMusic;
        await bgMusic.playAsync();
      } catch (error) {
        console.log("Error loading sounds:", error);
      }
    };
    loadSounds();
    return () => {
      collectSoundRef.current?.unloadAsync().catch(() => {});
      backgroundMusicRef.current?.unloadAsync().catch(() => {});
    };
  }, []);
  
  // Patrón de frutas
  const fruitPatternRef = useRef<{ pattern: string; percentages: number[] }>({
    pattern: "random",
    percentages: [0.2, 0.4, 0.6, 0.8],
  });

  // Inicializar obstáculos
  useEffect(() => {
    const initialObstacles: Obstacle[] = [
      { id: 1, x: SCREEN_WIDTH, gapY: Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100 },
      { id: 2, x: SCREEN_WIDTH + 300, gapY: Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100 },
      { id: 3, x: SCREEN_WIDTH + 600, gapY: Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100 },
    ];
    setObstacles(initialObstacles);
    obstaclesRef.current = initialObstacles; // Actualizar ref
    obstaclesShared.value = initialObstacles; // Actualizar shared value
    
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
          const outsideObstacleX = randomX < obs.x || randomX > obs.x + OBSTACLE_WIDTH;
          
          if (inGap || outsideObstacleX) {
            validPosition = true;
          }
          attempts++;
        }
        
        // Si no encontró posición válida, usar el hueco por defecto
        if (!validPosition) {
          randomY = obs.gapY + OBSTACLE_GAP / 2;
        }
        
        const fruitTypes: FruitType[] = ["apple", "banana", "cherry", "mandarin", "orange", "peach", "pear", "strawberry", "watermelon"];
        const randomType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
        
        initialFruits.push({
          id: index * 10 + i,
          x: randomX,
          y: randomY,
          collected: false,
          type: randomType,
        });
      }
    });
    setFruits(initialFruits);
  }, []);

  // Actualizar posición del pájaro según fuerza
  // SIN obstacles en dependencias para evitar deslizamiento automático
  useEffect(() => {
    if (isPaused) return;
    
    const maxForce = highZone || 20;
    const forcePercent = Math.max(0, Math.min(1, currentForce / maxForce));
    
    const minY = 50;
    const maxY = SCREEN_HEIGHT - BIRD_SIZE - 50;
    const targetY = maxY - (forcePercent * (maxY - minY));
    
    // NO limitar aquí - se limitará en game loop cuando detecte invasión real
    
    birdY.value = withTiming(targetY, { duration: 100 });
  }, [currentForce, highZone, isPaused]);
  
  // Exponer función getStats para que el padre pueda obtener estadísticas
  useImperativeHandle(ref, () => ({
    getStats: () => {
      const readings = forceReadings.current;
      if (readings.length > 0) {
        const avgForce = readings.reduce((a, b) => a + b, 0) / readings.length;
        const maxForce = maxForceRef.current;
        const minForce = Math.min(...readings);
        return { avgForce, maxForce, minForce };
      }
      return { avgForce: 0, maxForce: 0, minForce: 0 };
    },
  }));
  
  // Ref para trackear estado anterior de isPaused
  const wasPausedRef = useRef(isPaused);
  
  // Calcular y enviar estadísticas cuando el juego se pausa (termina)
  useEffect(() => {
    // Detectar cuando isPaused cambia de false a true (juego termina)
    if (isPaused && !wasPausedRef.current && onForceStats) {
      const readings = forceReadings.current;
      console.log('[FlappyBirdGame] Juego pausado - Calculando estadísticas:', {
        readingsCount: readings.length,
        maxForceRef: maxForceRef.current,
        firstReadings: readings.slice(0, 5),
      });
      
      if (readings.length > 0) {
        const avgForce = readings.reduce((a, b) => a + b, 0) / readings.length;
        const maxForce = maxForceRef.current;
        const minForce = Math.min(...readings);
        console.log('[FlappyBirdGame] Enviando stats:', { avgForce, maxForce, minForce });
        onForceStats({ avgForce, maxForce, minForce });
      } else {
        console.warn('[FlappyBirdGame] No hay lecturas de fuerza');
      }
    }
    
    // Actualizar ref para próxima comparación
    wasPausedRef.current = isPaused;
  }, [isPaused, onForceStats]);
  
  // Reacción animada para limitar posición en UI thread (sin bucle de JS)
  useAnimatedReaction(
    () => birdY.value,
    (currentY, previousY) => {
      'worklet';
      
      if (previousY === null) return;
      
      const birdRightX = BIRD_X + BIRD_SIZE;
      const birdLeftX = BIRD_X;
      const birdTopY = currentY;
      const birdBottomY = currentY + BIRD_SIZE;
      
      for (const obs of obstaclesShared.value) {
        // Si el pájaro está en el rango horizontal del obstáculo
        if (birdRightX > obs.x && birdLeftX < obs.x + OBSTACLE_WIDTH) {
          // Si intenta entrar en bloque superior
          if (birdTopY < obs.gapY && previousY >= obs.gapY) {
            cancelAnimation(birdY);
            birdY.value = obs.gapY;
            return;
          }
          // Si intenta entrar en bloque inferior
          if (birdBottomY > obs.gapY + OBSTACLE_GAP && previousY + BIRD_SIZE <= obs.gapY + OBSTACLE_GAP) {
            cancelAnimation(birdY);
            birdY.value = obs.gapY + OBSTACLE_GAP - BIRD_SIZE;
            return;
          }
        }
      }
    },
    []
  );

  // Game loop: mover obstáculos, detectar colisiones, recoger frutas
  useEffect(() => {
    if (isPaused) return;
    
    let obstacleIdCounter = 4;
    let fruitIdCounter = 100;
    
    const interval = setInterval(() => {
      // Trackear fuerza en cada frame
      if (currentForce > 0) {
        forceReadings.current.push(currentForce);
        if (currentForce > maxForceRef.current) {
          maxForceRef.current = currentForce;
        }
      }
      
      const currentBirdY = birdY.value;
      const birdRightX = BIRD_X + BIRD_SIZE;
      const birdLeftX = BIRD_X;
      const birdTopY = currentBirdY;
      const birdBottomY = currentBirdY + BIRD_SIZE;
      
      // Detectar colisión FRONTAL (parte derecha del pájaro)
      let colliding = false;
      let collidingObsId: number | null = null;
      
      for (const obs of obstacles) {
        // Verificar si el pájaro está en el rango horizontal del obstáculo
        const inObstacleXRange = birdRightX > obs.x && birdLeftX < obs.x + OBSTACLE_WIDTH;
        
        if (inObstacleXRange) {
          const inTopBlock = birdTopY < obs.gapY;
          const inBottomBlock = birdBottomY > obs.gapY + OBSTACLE_GAP;
          
          if (inTopBlock || inBottomBlock) {
            // Colisión FRONTAL: solo si la parte derecha está ENTRANDO (primeros 20px del obstáculo)
            const isFrontalCollision = birdRightX > obs.x && birdRightX < obs.x + 20;
            if (isFrontalCollision) {
              colliding = true;
              collidingObsId = obs.id;
              // Llamar callback de colisión solo si es un obstáculo diferente al último
              if (onCollision && lastCollisionObstacleId.current !== obs.id) {
                lastCollisionObstacleId.current = obs.id;
                onCollision();
              }
              break;
            }
          }
        }
      }
      
      setCollidingObstacleId(collidingObsId);
      
      // Recoger frutas
      setFruits(prev => {
        let newCollected = 0;
        const updated = prev.map(fruit => {
          if (!fruit.collected) {
            const fruitCenterX = fruit.x;
            const fruitCenterY = fruit.y;
            const distance = Math.sqrt(
              Math.pow(BIRD_X + BIRD_SIZE / 2 - fruitCenterX, 2) +
              Math.pow(currentBirdY + BIRD_SIZE / 2 - fruitCenterY, 2)
            );
            if (distance < 40) {
              newCollected++;
              return { ...fruit, collected: true };
            }
          }
          return fruit;
        });
        
        if (newCollected > 0) {
          const newTotal = collectedFruits + newCollected;
          setCollectedFruits(newTotal);
          onFruitCollected?.(newTotal);
          // Reproducir sonido de recolección
          runOnJS(() => {
            try {
              if (collectSoundRef.current) {
                collectSoundRef.current.replayAsync().catch((e: any) => {
                  console.log('Error playing sound:', e);
                  console.log("Error playing collect sound:", e);
                });
              }
            } catch (e) {
              console.log("Error playing collect sound:", e);
            }
          })();
        }
        
        return updated;
      });
      
      // Solo mover obstáculos si NO hay colisión frontal
      if (!colliding) {
        setObstacles(prev => {
          const updated = prev.map(obs => ({ ...obs, x: obs.x - OBSTACLE_SPEED }));
          const visible = updated.filter(obs => obs.x > -OBSTACLE_WIDTH);
          
          // Actualizar ref y shared value
          obstaclesRef.current = visible;
          obstaclesShared.value = visible;
          
          // Generar nuevo obstáculo si es necesario
          if (visible.length < 3) {
            const last = visible[visible.length - 1];
            if (!last || last.x < SCREEN_WIDTH - 300) {
              const gapY = Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100;
              const newObs = {
                id: obstacleIdCounter++,
                x: SCREEN_WIDTH,
                gapY,
              };
              visible.push(newObs);
              
              // Generar frutas para el nuevo obstáculo
              setFruits(prevFruits => {
                const fruitCount = 1 + Math.floor(Math.random() * 2); // 1 o 2 frutas
                const newFruits: Fruit[] = [];
                for (let i = 0; i < fruitCount; i++) {
                  // Posición X aleatoria en rango amplio
                  const randomX = newObs.x - 150 + Math.random() * 400;
                  
                  // Posición Y aleatoria en toda la pantalla (evitando bloques)
                  let randomY = newObs.gapY + OBSTACLE_GAP / 2; // Valor por defecto
                  let attempts = 0;
                  let validPosition = false;
                  
                  while (!validPosition && attempts < 10) {
                    randomY = 50 + Math.random() * (SCREEN_HEIGHT - 100);
                    
                    // Verificar si está en el hueco O fuera de la zona horizontal del obstáculo
                    const inGap = randomY >= newObs.gapY && randomY <= newObs.gapY + OBSTACLE_GAP;
                    const outsideObstacleX = randomX < newObs.x || randomX > newObs.x + OBSTACLE_WIDTH;
                    
                    if (inGap || outsideObstacleX) {
                      validPosition = true;
                    }
                    attempts++;
                  }
                  
                  // Si no encontró posición válida, usar el hueco por defecto
                  if (!validPosition) {
                    randomY = newObs.gapY + OBSTACLE_GAP / 2;
                  }
                  
                  const fruitTypes: FruitType[] = ["apple", "banana", "cherry", "mandarin", "orange", "peach", "pear", "strawberry", "watermelon"];
                  const randomType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
                  
                  newFruits.push({
                    id: fruitIdCounter++,
                    x: randomX,
                    y: randomY,
                    collected: false,
                    type: randomType,
                  });
                }
                return [...prevFruits, ...newFruits];
              });
            }
          }
          
          return visible;
        });
        
        // Mover frutas
        setFruits(prev => 
          prev.map(fruit => ({ ...fruit, x: fruit.x - OBSTACLE_SPEED }))
            .filter(fruit => fruit.x > -50)
        );
      }
    }, 16);
    
    return () => clearInterval(interval);
  }, [isPaused, collectedFruits, onFruitCollected, obstacles]);

  // Estilo animado del pájaro
  const birdStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: birdY.value }],
    };
  });
  
  const BIRD_COLOR = "#FFD700"; // Dorado
  
  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      
      {/* Obstáculos */}
      {obstacles.map(obs => {
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
      {fruits.map(fruit => {
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
        
        return !fruit.collected && (
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
        );
      })}
      
      {/* Pájaro */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: BIRD_X,
            top: 0,
            width: BIRD_SIZE,
            height: BIRD_SIZE,
            zIndex: 100,
          },
          birdStyle,
        ]}
      >
        <Image
          source={require("@/assets/sprites/bird.gif")}
          style={{ width: BIRD_SIZE, height: BIRD_SIZE }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
});

FlappyBirdGame.displayName = 'FlappyBirdGame';
