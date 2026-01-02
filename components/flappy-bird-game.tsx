import React, { useEffect, useRef, useState } from "react";
import { View, Dimensions, Text, Animated } from "react-native";

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
  // Usar Animated.Value para la posición del pájaro
  const birdY = useRef(new Animated.Value(SCREEN_HEIGHT / 2)).current;
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  
  const currentForceRef = useRef(0);
  const highZoneRef = useRef(0);
  const isPausedRef = useRef(false);
  const birdYValue = useRef(SCREEN_HEIGHT / 2);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const fruitsRef = useRef<Fruit[]>([]);
  const gameOverCalledRef = useRef(false);
  
  useEffect(() => { currentForceRef.current = currentForce; }, [currentForce]);
  useEffect(() => { highZoneRef.current = highZone; }, [highZone]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);
  useEffect(() => { fruitsRef.current = fruits; }, [fruits]);
  
  // Listener para actualizar birdYValue cuando cambia birdY (Animated.Value)
  useEffect(() => {
    const listenerId = birdY.addListener(({ value }) => {
      birdYValue.current = value;
    });
    
    return () => {
      birdY.removeListener(listenerId);
    };
  }, []);
  
  // Generar obstáculos y frutos iniciales
  useEffect(() => {
    const initialObstacles: Obstacle[]= [];
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
  
  // Game loop
  useEffect(() => {
    let frameId: number;
    let obstacleIdCounter = 3;
    let fruitIdCounter = 3;
    
    const gameLoop = () => {
      if (isPausedRef.current || gameOverCalledRef.current) {
        frameId = requestAnimationFrame(gameLoop);
        return;
      }
      
      // ===== CONTROL DIRECTO DEL PÁJARO =====
      const force = currentForceRef.current;
      const maxForce = highZoneRef.current || 20;
      
      const forcePercent = Math.max(0, Math.min(1, force / maxForce));
      
      const minY = 50;
      const maxY = SCREEN_HEIGHT - BIRD_SIZE - 50;
      const targetY = maxY - (forcePercent * (maxY - minY));
      
      // Actualizar Animated.Value directamente (sin animación, cambio inmediato)
      birdY.setValue(targetY);
      
      // ===== ACTUALIZAR OBSTÁCULOS =====
      const updatedObstacles = obstaclesRef.current.map(obs => ({
        ...obs,
        x: obs.x - OBSTACLE_SPEED,
      }));
      
      const visibleObstacles = updatedObstacles.filter(obs => obs.x > -OBSTACLE_WIDTH);
      
      if (visibleObstacles.length < 3) {
        const lastObstacle = visibleObstacles[visibleObstacles.length - 1];
        if (!lastObstacle || lastObstacle.x < SCREEN_WIDTH - 300) {
          const gapY = Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100;
          visibleObstacles.push({
            id: obstacleIdCounter++,
            x: SCREEN_WIDTH,
            gapY,
          });
        }
      }
      
      setObstacles(visibleObstacles);
      
      // ===== ACTUALIZAR FRUTOS =====
      const updatedFruits = fruitsRef.current.map(fruit => ({
        ...fruit,
        x: fruit.x - OBSTACLE_SPEED,
      }));
      
      const visibleFruits = updatedFruits.filter(fruit => fruit.x > -FRUIT_SIZE);
      
      if (visibleFruits.length < 3) {
        const lastFruit = visibleFruits[visibleFruits.length - 1];
        if (!lastFruit || lastFruit.x < SCREEN_WIDTH - 300) {
          const gapY = Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100;
          visibleFruits.push({
            id: fruitIdCounter++,
            x: SCREEN_WIDTH + OBSTACLE_WIDTH / 2,
            y: gapY + OBSTACLE_GAP / 2 - FRUIT_SIZE / 2,
            type: FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)],
            collected: false,
          });
        }
      }
      
      setFruits(visibleFruits);
      
      // ===== COLISIONES CON OBSTÁCULOS =====
      const birdX = 50;
      const currentBirdY = birdYValue.current;
      
      for (const obs of visibleObstacles) {
        if (
          birdX + BIRD_SIZE > obs.x &&
          birdX < obs.x + OBSTACLE_WIDTH
        ) {
          if (
            currentBirdY < obs.gapY ||
            currentBirdY + BIRD_SIZE > obs.gapY + OBSTACLE_GAP
          ) {
            if (!gameOverCalledRef.current) {
              gameOverCalledRef.current = true;
              onGameOver();
            }
            return;
          }
        }
      }
      
      // ===== COLISIONES CON FRUTOS =====
      for (const fruit of visibleFruits) {
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
      
      frameId = requestAnimationFrame(gameLoop);
    };
    
    frameId = requestAnimationFrame(gameLoop);
    
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);
  
  // Color del pájaro según zona de fuerza
  const getBirdColor = () => {
    const force = currentForce;
    const low = lowZone;
    const high = highZone;
    
    if (force < low * 0.5) return "#999";
    if (force < low) return "#4CAF50";
    if (force < high) return "#FFC107";
    return "#F44336";
  };
  
  return (
    <View style={{ flex: 1, backgroundColor: "#87CEEB" }}>
      {/* Debug info */}
      <View style={{ position: "absolute", top: 10, left: 10, backgroundColor: "rgba(0,0,0,0.7)", padding: 8, borderRadius: 5, zIndex: 1000 }}>
        <Text style={{ color: "white", fontSize: 11 }}>Force: {currentForce.toFixed(1)} kg</Text>
        <Text style={{ color: "white", fontSize: 11 }}>Max: {highZone.toFixed(1)} kg</Text>
        <Text style={{ color: "white", fontSize: 11 }}>%: {((currentForce / highZone) * 100).toFixed(0)}%</Text>
        <Text style={{ color: "white", fontSize: 11 }}>BirdY: {birdYValue.current.toFixed(0)}</Text>
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
      
      {/* Pájaro con Animated.View */}
      <Animated.View
        style={{
          position: "absolute",
          left: 50,
          top: birdY,
          width: BIRD_SIZE,
          height: BIRD_SIZE,
          backgroundColor: getBirdColor(),
          borderRadius: BIRD_SIZE / 2,
          borderWidth: 3,
          borderColor: "#000",
          zIndex: 100,
        }}
      />
    </View>
  );
}
