import React, { useEffect, useState } from "react";
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

export function FlappyBirdGame({
  currentForce,
  lowZone,
  highZone,
  isPaused,
  onFruitCollected,
  onGameOver,
}: FlappyBirdGameProps) {
  // Usar useSharedValue para la posición del pájaro (actualización en UI thread)
  const birdY = useSharedValue(SCREEN_HEIGHT / 2);
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [gameOverCalled, setGameOverCalled] = useState(false);
  
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
      
      initialFruits.push({
        id: i,
        x: SCREEN_WIDTH + i * 300 + OBSTACLE_WIDTH / 2,
        y: gapY + OBSTACLE_GAP / 2 - FRUIT_SIZE / 2,
        type: FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)],
        collected: false,
      });
    }
    
    setObstacles(initialObstacles);
    setFruits(initialFruits);
  }, []);
  
  // Actualizar posición del pájaro basado en currentForce
  useEffect(() => {
    if (isPaused) return;
    
    const maxForce = highZone || 20;
    const forcePercent = Math.max(0, Math.min(1, currentForce / maxForce));
    
    const minY = 50;
    const maxY = SCREEN_HEIGHT - BIRD_SIZE - 50;
    const targetY = maxY - (forcePercent * (maxY - minY));
    
    // Actualizar con animación suave
    birdY.value = withTiming(targetY, { duration: 100 });
  }, [currentForce, highZone, isPaused]);
  
  // Game loop para obstáculos y frutos
  useEffect(() => {
    if (isPaused || gameOverCalled) return;
    
    let obstacleIdCounter = 3;
    let fruitIdCounter = 3;
    
    const interval = setInterval(() => {
      // Actualizar obstáculos
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
      
      // Actualizar frutos
      setFruits(prev => {
        const updated = prev.map(fruit => ({ ...fruit, x: fruit.x - OBSTACLE_SPEED }));
        const visible = updated.filter(fruit => fruit.x > -FRUIT_SIZE);
        
        if (visible.length < 3) {
          const last = visible[visible.length - 1];
          if (!last || last.x < SCREEN_WIDTH - 300) {
            const gapY = Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100;
            visible.push({
              id: fruitIdCounter++,
              x: SCREEN_WIDTH + OBSTACLE_WIDTH / 2,
              y: gapY + OBSTACLE_GAP / 2 - FRUIT_SIZE / 2,
              type: FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)],
              collected: false,
            });
          }
        }
        
        return visible;
      });
      
      // Colisiones con obstáculos eliminadas - el juego avanza continuamente
      const birdX = 50;
      const currentBirdY = birdY.value;
      
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
  }, [isPaused, gameOverCalled, obstacles, fruits]);
  
  // Estilo animado para el pájaro
  const birdStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: birdY.value }],
    };
  });
  
  // Color del pájaro
  const getBirdColor = () => {
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
      
      {/* Frutos */}
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
      
      {/* Pájaro con Animated.View y useAnimatedStyle */}
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
