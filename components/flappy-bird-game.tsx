import React, { useEffect, useRef, useState } from "react";
import { View, Dimensions, Text, Image } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const BIRD_SIZE = 50;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_GAP = 180;
const OBSTACLE_SPEED = 2;
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

const FRUIT_TYPES = [
  "watermelon",
  "banana",
  "apple",
  "orange",
  "strawberry",
  "cherry",
  "peach",
  "pear",
  "mandarin",
];

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

export function FlappyBirdGame({
  currentForce,
  lowZone,
  highZone,
  isPaused,
  onFruitCollected,
  onGameOver,
}: FlappyBirdGameProps) {
  // Estado del pájaro
  const [birdY, setBirdY] = useState(SCREEN_HEIGHT / 2);
  
  // Estado de obstáculos y frutos
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  
  // Refs para valores que necesita el game loop
  const currentForceRef = useRef(0);
  const lowZoneRef = useRef(0);
  const highZoneRef = useRef(0);
  const isPausedRef = useRef(false);
  const birdYRef = useRef(SCREEN_HEIGHT / 2);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const fruitsRef = useRef<Fruit[]>([]);
  const gameOverCalledRef = useRef(false);
  
  // Actualizar refs cuando cambian las props/estado
  useEffect(() => {
    currentForceRef.current = currentForce;
  }, [currentForce]);
  
  useEffect(() => {
    lowZoneRef.current = lowZone;
  }, [lowZone]);
  
  useEffect(() => {
    highZoneRef.current = highZone;
  }, [highZone]);
  
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  
  useEffect(() => {
    birdYRef.current = birdY;
  }, [birdY]);
  
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);
  
  useEffect(() => {
    fruitsRef.current = fruits;
  }, [fruits]);
  
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
      
      // Agregar fruto en el centro del hueco
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
  
  // Game loop con requestAnimationFrame (60 FPS) - COPIADO DE CRANE
  useEffect(() => {
    let frameId: number;
    let obstacleIdCounter = 3;
    let fruitIdCounter = 3;
    
    const gameLoop = () => {
      // Si está pausado, no actualizar
      if (isPausedRef.current || gameOverCalledRef.current) {
        frameId = requestAnimationFrame(gameLoop);
        return;
      }
      
      // ===== ACTUALIZAR POSICIÓN DEL PÁJARO =====
      const force = currentForceRef.current;
      const low = lowZoneRef.current;
      const high = highZoneRef.current;
      
      let targetY: number;
      
      if (force <= low) {
        targetY = SCREEN_HEIGHT - 100;
      } else if (force >= high) {
        targetY = 50;
      } else {
        const forceRatio = (force - low) / (high - low);
        targetY = SCREEN_HEIGHT - 100 - (forceRatio * (SCREEN_HEIGHT - 150));
      }
      
      setBirdY(targetY);
      
      // ===== ACTUALIZAR OBSTÁCULOS =====
      const updatedObstacles = obstaclesRef.current.map(obs => ({
        ...obs,
        x: obs.x - OBSTACLE_SPEED,
      }));
      
      // Eliminar obstáculos que salieron de la pantalla
      const visibleObstacles = updatedObstacles.filter(obs => obs.x > -OBSTACLE_WIDTH);
      
      // Agregar nuevo obstáculo si es necesario
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
      
      // Eliminar frutos que salieron de la pantalla
      const visibleFruits = updatedFruits.filter(fruit => fruit.x > -FRUIT_SIZE);
      
      // Agregar nuevo fruto si es necesario
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
      
      // ===== DETECTAR COLISIONES CON OBSTÁCULOS =====
      const birdX = 50;
      const currentBirdY = birdYRef.current;
      
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
      
      // ===== DETECTAR COLISIONES CON FRUTOS =====
      for (const fruit of visibleFruits) {
        if (!fruit.collected) {
          const distance = Math.sqrt(
            Math.pow(birdX + BIRD_SIZE / 2 - (fruit.x + FRUIT_SIZE / 2), 2) +
            Math.pow(currentBirdY + BIRD_SIZE / 2 - (fruit.y + FRUIT_SIZE / 2), 2)
          );
          
          if (distance < (BIRD_SIZE + FRUIT_SIZE) / 2) {
            // Fruto recogido
            fruit.collected = true;
            onFruitCollected();
          }
        }
      }
      
      // Siguiente frame
      frameId = requestAnimationFrame(gameLoop);
    };
    
    // Iniciar game loop
    frameId = requestAnimationFrame(gameLoop);
    
    // Cleanup
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []); // Sin dependencias - el loop corre continuamente
  
  // Determinar color del pájaro según zona de fuerza
  const getBirdColor = () => {
    const force = currentForce;
    const low = lowZone;
    const high = highZone;
    
    if (force < low * 0.8) return "#666"; // Gris (sin fuerza)
    if (force < low) return "#4CAF50"; // Verde (zona baja)
    if (force < high) return "#FFC107"; // Amarillo (zona media)
    return "#F44336"; // Rojo (zona alta)
  };
  
  return (
    <View style={{ flex: 1, backgroundColor: "#87CEEB" }}>
      {/* Obstáculos */}
      {obstacles.map(obs => (
        <View key={obs.id}>
          {/* Obstáculo superior */}
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
          {/* Obstáculo inferior */}
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
      
      {/* Pájaro */}
      <View
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
