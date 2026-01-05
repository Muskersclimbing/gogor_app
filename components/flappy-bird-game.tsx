import React, { useEffect, useState, useRef } from "react";
import { View, Dimensions, Text } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const BIRD_SIZE = 50;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_GAP = 200;
const OBSTACLE_SPEED = 3;
const FRUIT_SIZE = 30;

interface Obstacle {
  id: number;
  x: number;
  gapY: number;
}

interface Fruit {
  id: number;
  x: number;
  y: number;
  type: string;
  collected: boolean;
}

interface FlappyBirdGameProps {
  currentForce: number;
  lowZone: number;
  highZone: number;
  isPaused: boolean;
  onFruitCollected: () => void;
  onGameOver: () => void;
  onForceStats?: (maxForce: number, avgForce: number) => void;
}

const FRUIT_COLORS: Record<string, string> = {
  watermelon: "#FF6B6B",
  banana: "#FFE66D",
  apple: "#FF0000",
  orange: "#FFA500",
  strawberry: "#FF1744",
  cherry: "#C62828",
  peach: "#FFAB91",
  pear: "#AED581",
  mandarin: "#FF9800",
};

const FRUIT_TYPES = Object.keys(FRUIT_COLORS);

// Patrones de frutas
type FruitPattern = "isometric" | "dynamic" | "progressive";

function generateFruitPattern(): { pattern: FruitPattern; count: number; baseHeight: number } {
  const patterns: FruitPattern[] = ["isometric", "dynamic", "progressive"];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  
  // Distribución: 40% alta, 30% media, 30% baja
  const rand = Math.random();
  let baseHeight: number;
  if (rand < 0.4) {
    // Alta (65-100%)
    baseHeight = 0.65 + Math.random() * 0.35;
  } else if (rand < 0.7) {
    // Media (35-65%)
    baseHeight = 0.35 + Math.random() * 0.3;
  } else {
    // Baja (0-35%)
    baseHeight = Math.random() * 0.35;
  }
  
  const count = pattern === "isometric" ? 3 + Math.floor(Math.random() * 2) : 3; // 3-4 para isométrico, 3 para otros
  
  return { pattern, count, baseHeight };
}

export function FlappyBirdGame({
  currentForce,
  lowZone,
  highZone,
  isPaused,
  onFruitCollected,
  onGameOver,
  onForceStats,
}: FlappyBirdGameProps) {
  const birdY = useSharedValue(SCREEN_HEIGHT / 2);
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [isColliding, setIsColliding] = useState(false);
  
  // Tracking de fuerza
  const forceReadings = useRef<number[]>([]);
  const maxForceRef = useRef<number>(0);
  
  const fruitPatternRef = useRef(generateFruitPattern());
  const fruitCounterRef = useRef(0);
  
  // Generar obstáculos y frutos iniciales
  useEffect(() => {
    const initialObstacles: Obstacle[] = [];
    const initialFruits: Fruit[] = [];
    
    for (let i = 0; i < 3; i++) {
      const gapY = Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100;
      initialObstacles.push({
        id: i,
        x: SCREEN_WIDTH + i * 300,
        gapY,
      });
      
      // Generar fruta según patrón
      const fruitY = generateFruitY(gapY, i);
      initialFruits.push({
        id: i,
        x: SCREEN_WIDTH + i * 300 + OBSTACLE_WIDTH / 2 - FRUIT_SIZE / 2,
        y: fruitY,
        type: FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)],
        collected: false,
      });
    }
    
    setObstacles(initialObstacles);
    setFruits(initialFruits);
  }, []);
  
  function generateFruitY(gapY: number, index: number): number {
    const { pattern, count, baseHeight } = fruitPatternRef.current;
    
    // Si completamos el patrón, generar uno nuevo
    if (fruitCounterRef.current >= count) {
      fruitPatternRef.current = generateFruitPattern();
      fruitCounterRef.current = 0;
    }
    
    fruitCounterRef.current++;
    
    const gapHeight = OBSTACLE_GAP;
    
    switch (pattern) {
      case "isometric":
        // Todas las frutas a la misma altura
        return gapY + gapHeight * Math.max(0.1, Math.min(0.9, baseHeight));
      
      case "dynamic":
        // Alterna entre alta y baja
        const isHigh = fruitCounterRef.current % 2 === 0;
        return gapY + gapHeight * (isHigh ? 0.75 : 0.25);
      
      case "progressive":
        // Sube o baja gradualmente
        const progress = fruitCounterRef.current / count;
        const progressHeight = baseHeight + (progress - 0.5) * 0.4;
        return gapY + gapHeight * Math.max(0.1, Math.min(0.9, progressHeight));
      
      default:
        return gapY + gapHeight * 0.5;
    }
  }
  
  // Actualizar posición del pájaro basado en currentForce
  useEffect(() => {
    if (isPaused) return;
    
    // Trackear fuerza
    if (currentForce > 0) {
      forceReadings.current.push(currentForce);
      if (currentForce > maxForceRef.current) {
        maxForceRef.current = currentForce;
      }
    }
    
    const maxForce = highZone || 20;
    const forcePercent = Math.max(0, Math.min(1, currentForce / maxForce));
    
    const minY = 50;
    const maxY = SCREEN_HEIGHT - BIRD_SIZE - 50;
    const targetY = maxY - (forcePercent * (maxY - minY));
    
    birdY.value = withTiming(targetY, { duration: 100 });
  }, [currentForce, highZone, isPaused]);
  
  // Calcular y enviar estadísticas al finalizar
  useEffect(() => {
    if (isPaused && onForceStats && forceReadings.current.length > 0) {
      const avgForce = forceReadings.current.reduce((a, b) => a + b, 0) / forceReadings.current.length;
      onForceStats(maxForceRef.current, avgForce);
    }
  }, [isPaused, onForceStats]);
  
  // Game loop
  useEffect(() => {
    if (isPaused) return;
    
    let obstacleIdCounter = 3;
    let fruitIdCounter = 3;
    
    const interval = setInterval(() => {
      const birdX = 50;
      const currentBirdY = birdY.value;
      
      // Detectar colisión: FRONTAL pausa, resto solo visual
      let colliding = false;
      let visualCollision = false;
      
      for (const obs of obstacles) {
        const birdLeftX = birdX; // Parte trasera (izquierda)
        const birdRightX = birdX + BIRD_SIZE; // Parte delantera (derecha)
        const birdTopY = currentBirdY;
        const birdBottomY = currentBirdY + BIRD_SIZE;
        
        // Verificar si el pájaro está en el rango horizontal del obstáculo
        const inObstacleXRange = birdRightX > obs.x && birdLeftX < obs.x + OBSTACLE_WIDTH;
        
        if (inObstacleXRange) {
          const inTopBlock = birdTopY < obs.gapY;
          const inBottomBlock = birdBottomY > obs.gapY + OBSTACLE_GAP;
          
          if (inTopBlock || inBottomBlock) {
            // Hay colisión con bloque → PAUSAR (igual que frontal)
            visualCollision = true;
            colliding = true;
            break;
          }
        }
      }
      
      setIsColliding(visualCollision); // Mostrar rojo si hay cualquier colisión
      
      // Solo mover obstáculos si NO hay colisión
      if (!colliding) {
        setObstacles(prev => {
          const updated = prev.map(obs => ({ ...obs, x: obs.x - OBSTACLE_SPEED }));
          const visible = updated.filter(obs => obs.x > -OBSTACLE_WIDTH);
          
          if (visible.length < 3) {
            const last = visible[visible.length - 1];
            if (!last || last.x < SCREEN_WIDTH - 300) {
              const gapY = Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100;
              visible.push({
                id: obstacleIdCounter++,
                x: SCREEN_WIDTH,
                gapY,
              });
            }
          }
          
          return visible;
        });
        
        setFruits(prev => {
          const updated = prev.map(fruit => ({ ...fruit, x: fruit.x - OBSTACLE_SPEED }));
          const visible = updated.filter(fruit => fruit.x > -FRUIT_SIZE);
          
          if (visible.length < 3) {
            const last = visible[visible.length - 1];
            if (!last || last.x < SCREEN_WIDTH - 300) {
              // Usar el gapY del último obstáculo para asegurar que la fruta esté en el hueco
              const lastObstacle = obstacles[obstacles.length - 1];
              if (lastObstacle) {
                const fruitY = generateFruitY(lastObstacle.gapY, fruitIdCounter);
                
                visible.push({
                  id: fruitIdCounter++,
                  x: SCREEN_WIDTH + OBSTACLE_WIDTH / 2 - FRUIT_SIZE / 2,
                  y: fruitY,
                  type: FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)],
                  collected: false,
                });
              }
            }
          }
          
          return visible;
        });
      }
      
      // Colisiones con frutas (siempre activas)
      for (const fruit of fruits) {
        if (!fruit.collected) {
          const distance = Math.sqrt(
            Math.pow(birdX + BIRD_SIZE / 2 - (fruit.x + FRUIT_SIZE / 2), 2) +
            Math.pow(currentBirdY + BIRD_SIZE / 2 - (fruit.y + FRUIT_SIZE / 2), 2)
          );
          
          if (distance < (BIRD_SIZE + FRUIT_SIZE) / 2) {
            fruit.collected = true;
            onFruitCollected();
          }
        }
      }
    }, 16); // ~60 FPS
    
    return () => clearInterval(interval);
  }, [isPaused, obstacles, fruits]);
  
  // Estilo animado para el pájaro
  const birdStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: birdY.value }],
    };
  });
  
  // Color del pájaro
  const getBirdColor = () => {
    if (isColliding) return "#FF0000"; // Rojo cuando choca
    if (currentForce < lowZone * 0.5) return "#999";
    if (currentForce < lowZone) return "#4CAF50";
    if (currentForce < highZone) return "#FFC107";
    return "#F44336";
  };
  
  return (
    <View style={{ flex: 1, backgroundColor: "#87CEEB" }}>
      {/* Debug info */}
      <View style={{ position: "absolute", top: 10, left: 10, backgroundColor: "rgba(0,0,0,0.7)", padding: 8, borderRadius: 5, zIndex: 1000 }}>
        <Text style={{ color: "white", fontSize: 11 }}>Force: {currentForce.toFixed(1)} kg</Text>
        <Text style={{ color: "white", fontSize: 11 }}>Max: {highZone.toFixed(1)} kg</Text>
        <Text style={{ color: "white", fontSize: 11 }}>%: {((currentForce / highZone) * 100).toFixed(0)}%</Text>
        <Text style={{ color: "white", fontSize: 11 }}>BirdY: {birdY.value.toFixed(0)}</Text>
        <Text style={{ color: isColliding ? "red" : "lime", fontSize: 11 }}>
          {isColliding ? "COLISIÓN" : "OK"}
        </Text>
        <Text style={{ color: "cyan", fontSize: 11 }}>
          Pattern: {fruitPatternRef.current.pattern}
        </Text>
      </View>
      
      {/* Obstáculos */}
      {obstacles.map(obs => (
        <View key={obs.id}>
          <View
            style={{
              position: "absolute",
              left: obs.x,
              top: 0,
              width: OBSTACLE_WIDTH,
              height: obs.gapY,
              backgroundColor: "#8B4513",
              borderWidth: 2,
              borderColor: "#654321",
            }}
          />
          <View
            style={{
              position: "absolute",
              left: obs.x,
              top: obs.gapY + OBSTACLE_GAP,
              width: OBSTACLE_WIDTH,
              height: SCREEN_HEIGHT - (obs.gapY + OBSTACLE_GAP),
              backgroundColor: "#8B4513",
              borderWidth: 2,
              borderColor: "#654321",
            }}
          />
        </View>
      ))}
      
      {/* Frutas */}
      {fruits.map(fruit => (
        !fruit.collected && (
          <View
            key={fruit.id}
            style={{
              position: "absolute",
              left: fruit.x,
              top: fruit.y,
              width: FRUIT_SIZE,
              height: FRUIT_SIZE,
              backgroundColor: FRUIT_COLORS[fruit.type],
              borderRadius: FRUIT_SIZE / 2,
              borderWidth: 2,
              borderColor: "#000",
            }}
          />
        )
      ))}
      
      {/* Pájaro */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 50,
            top: 0,
            width: BIRD_SIZE,
            height: BIRD_SIZE,
            backgroundColor: getBirdColor(),
            borderRadius: BIRD_SIZE / 2,
            borderWidth: 3,
            borderColor: "#000",
            zIndex: 100,
          },
          birdStyle,
        ]}
      />
    </View>
  );
}
