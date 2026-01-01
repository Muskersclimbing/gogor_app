import React, { useState, useEffect, useRef } from "react";
import { View, Dimensions, Image, Platform } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Constantes de física
const GRAVITY = 0.5; // Gravedad (píxeles por frame)
const JUMP_FORCE = -12; // Fuerza de salto hacia arriba (negativo = arriba)
const BIRD_SIZE = 50;
const OBSTACLE_WIDTH = 80;
const OBSTACLE_GAP = 200;
const FRUIT_SIZE = 40;
const SCROLL_SPEED = 3;

interface FlappyBirdGameProps {
  currentForce: number;
  lowZone: number;
  midZone: number;
  highZone: number;
  onFruitCollected: () => void;
  onCollision: () => void;
  isPaused: boolean;
}

interface Obstacle {
  id: number;
  x: number;
  gapY: number;
}

interface Fruit {
  id: number;
  x: number;
  y: number;
  type: number;
  collected: boolean;
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
  // Posición y velocidad del pájaro
  const [birdY, setBirdY] = useState(SCREEN_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const birdRotation = useSharedValue(0);
  
  // Estado del juego
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const obstacleIdCounter = useRef(0);
  const fruitIdCounter = useRef(0);
  const hasCollidedRef = useRef(false);
  
  // Frame counter para generar obstáculos y frutos
  const frameCounter = useRef(0);
  
  // **TÉCNICA DE CRANE**: Actualizar posición del pájaro cada vez que cambia currentForce
  useEffect(() => {
    if (isPaused || hasCollidedRef.current) return;
    
    // Aplicar gravedad
    birdVelocity.current += GRAVITY;
    
    // Si hay fuerza suficiente, aplicar impulso hacia arriba
    if (currentForce > lowZone) {
      const forceRatio = (currentForce - lowZone) / (highZone - lowZone);
      const jumpStrength = JUMP_FORCE * Math.min(forceRatio * 2, 1.5);
      birdVelocity.current = jumpStrength;
    }
    
    // Limitar velocidad
    birdVelocity.current = Math.max(-15, Math.min(15, birdVelocity.current));
    
    // Actualizar posición
    setBirdY((prevY) => {
      let newY = prevY + birdVelocity.current;
      
      // Limitar a los bordes de la pantalla
      if (newY < 0) {
        newY = 0;
        birdVelocity.current = 0;
      } else if (newY > SCREEN_HEIGHT - BIRD_SIZE - 100) {
        newY = SCREEN_HEIGHT - BIRD_SIZE - 100;
        birdVelocity.current = 0;
      }
      
      return newY;
    });
    
    // Actualizar rotación
    birdRotation.value = withTiming(
      Math.max(-30, Math.min(30, birdVelocity.current * 3)),
      { duration: 100 }
    );
  }, [currentForce, isPaused, lowZone, highZone]);
  
  // Game loop para obstáculos y frutos (60 FPS)
  useEffect(() => {
    if (isPaused || hasCollidedRef.current) return;
    
    const gameLoop = setInterval(() => {
      frameCounter.current++;
      
      // Mover obstáculos
      setObstacles((prev) => {
        const updated = prev.map((obs) => ({
          ...obs,
          x: obs.x - SCROLL_SPEED,
        }));
        
        // Generar nuevo obstáculo
        if (frameCounter.current % 100 === 0) {
          const gapY = Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100;
          updated.push({
            id: obstacleIdCounter.current++,
            x: SCREEN_WIDTH,
            gapY,
          });
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
        
        // Generar nuevo fruto
        if (frameCounter.current % 120 === 0) {
          const fruitY = Math.random() * (SCREEN_HEIGHT - FRUIT_SIZE - 200) + 100;
          updated.push({
            id: fruitIdCounter.current++,
            x: SCREEN_WIDTH,
            y: fruitY,
            type: Math.floor(Math.random() * 9),
            collected: false,
          });
        }
        
        // Eliminar frutos fuera de pantalla
        return updated.filter((fruit) => fruit.x > -FRUIT_SIZE && !fruit.collected);
      });
      
      // Detectar colisiones con obstáculos
      obstacles.forEach((obs) => {
        const birdLeft = 50;
        const birdRight = 50 + BIRD_SIZE;
        const birdTop = birdY;
        const birdBottom = birdY + BIRD_SIZE;
        
        const obsLeft = obs.x;
        const obsRight = obs.x + OBSTACLE_WIDTH;
        
        // Colisión horizontal
        if (birdRight > obsLeft && birdLeft < obsRight) {
          // Colisión con obstáculo superior o inferior
          if (birdTop < obs.gapY || birdBottom > obs.gapY + OBSTACLE_GAP) {
            if (!hasCollidedRef.current) {
              hasCollidedRef.current = true;
              onCollision();
            }
          }
        }
      });
      
      // Detectar colisiones con frutos
      setFruits((prev) =>
        prev.map((fruit) => {
          if (fruit.collected) return fruit;
          
          const birdLeft = 50;
          const birdRight = 50 + BIRD_SIZE;
          const birdTop = birdY;
          const birdBottom = birdY + BIRD_SIZE;
          
          const fruitLeft = fruit.x;
          const fruitRight = fruit.x + FRUIT_SIZE;
          const fruitTop = fruit.y;
          const fruitBottom = fruit.y + FRUIT_SIZE;
          
          if (
            birdRight > fruitLeft &&
            birdLeft < fruitRight &&
            birdBottom > fruitTop &&
            birdTop < fruitBottom
          ) {
            onFruitCollected();
            return { ...fruit, collected: true };
          }
          
          return fruit;
        })
      );
    }, 16); // ~60 FPS
    
    return () => clearInterval(gameLoop);
  }, [isPaused, birdY, obstacles, onFruitCollected, onCollision]);
  
  // Reset collision flag when game resumes
  useEffect(() => {
    if (!isPaused) {
      hasCollidedRef.current = false;
    }
  }, [isPaused]);
  
  // Estilos animados
  const birdAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${birdRotation.value}deg` }],
  }));
  
  // Color del pájaro según zona de fuerza
  const getBirdColor = () => {
    if (currentForce >= highZone * 0.8) return "#EF4444"; // Rojo
    if (currentForce >= midZone) return "#F59E0B"; // Amarillo
    return "#22C55E"; // Verde
  };
  
  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, position: "absolute" }}>
      {/* Pájaro */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 50,
            top: birdY,
            width: BIRD_SIZE,
            height: BIRD_SIZE,
            backgroundColor: getBirdColor(),
            borderRadius: BIRD_SIZE / 2,
          },
          birdAnimatedStyle,
        ]}
      />
      
      {/* Obstáculos */}
      {obstacles.map((obs) => (
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
            }}
          />
          {/* Obstáculo inferior */}
          <View
            style={{
              position: "absolute",
              left: obs.x,
              top: obs.gapY + OBSTACLE_GAP,
              width: OBSTACLE_WIDTH,
              height: SCREEN_HEIGHT - obs.gapY - OBSTACLE_GAP,
              backgroundColor: "#8B4513",
            }}
          />
        </View>
      ))}
      
      {/* Frutos */}
      {fruits.map((fruit) => {
        if (fruit.collected) return null;
        
        const fruitColors = [
          "#FF6B6B", // Sandía
          "#FFD93D", // Plátano
          "#FF4757", // Manzana
          "#FFA502", // Naranja
          "#FF6348", // Fresa
          "#FFA500", // Mandarina
          "#DC143C", // Cereza
          "#9ACD32", // Pera
          "#FFB6C1", // Melocotón
        ];
        
        return (
          <View
            key={fruit.id}
            style={{
              position: "absolute",
              left: fruit.x,
              top: fruit.y,
              width: FRUIT_SIZE,
              height: FRUIT_SIZE,
              backgroundColor: fruitColors[fruit.type],
              borderRadius: FRUIT_SIZE / 2,
            }}
          />
        );
      })}
    </View>
  );
}
