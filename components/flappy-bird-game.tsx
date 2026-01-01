import React, { useState, useEffect, useRef } from "react";
import { View, Dimensions, Image } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Constantes de física
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
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
  const [birdY, setBirdY] = useState(SCREEN_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const birdRotation = useSharedValue(0);
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const obstacleIdCounter = useRef(0);
  const fruitIdCounter = useRef(0);
  const hasCollidedRef = useRef(false);
  const frameCounter = useRef(0);
  
  // Refs para capturar valores actualizados
  const currentForceRef = useRef(currentForce);
  const lowZoneRef = useRef(lowZone);
  const highZoneRef = useRef(highZone);
  
  useEffect(() => {
    currentForceRef.current = currentForce;
    lowZoneRef.current = lowZone;
    highZoneRef.current = highZone;
  }, [currentForce, lowZone, highZone]);
  
  // Game loop principal con requestAnimationFrame
  useEffect(() => {
    if (isPaused || hasCollidedRef.current) return;
    
    let animationFrameId: number;
    
    const gameLoop = () => {
      frameCounter.current++;
      
      // Física del pájaro
      birdVelocity.current += GRAVITY;
      
      if (currentForceRef.current > lowZoneRef.current) {
        const forceRatio = (currentForceRef.current - lowZoneRef.current) / (highZoneRef.current - lowZoneRef.current);
        const jumpStrength = JUMP_FORCE * Math.min(forceRatio * 2, 1.5);
        birdVelocity.current = jumpStrength;
      }
      
      birdVelocity.current = Math.max(-15, Math.min(15, birdVelocity.current));
      
      setBirdY((prevY) => {
        let newY = prevY + birdVelocity.current;
        
        if (newY < 0) {
          newY = 0;
          birdVelocity.current = 0;
        } else if (newY > SCREEN_HEIGHT - BIRD_SIZE - 100) {
          newY = SCREEN_HEIGHT - BIRD_SIZE - 100;
          birdVelocity.current = 0;
        }
        
        return newY;
      });
      
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
        
        if (frameCounter.current % 100 === 0) {
          const gapY = Math.random() * (SCREEN_HEIGHT - OBSTACLE_GAP - 200) + 100;
          updated.push({
            id: obstacleIdCounter.current++,
            x: SCREEN_WIDTH,
            gapY,
          });
        }
        
        return updated.filter((obs) => obs.x > -OBSTACLE_WIDTH);
      });
      
      // Mover frutos
      setFruits((prev) => {
        const updated = prev.map((fruit) => ({
          ...fruit,
          x: fruit.x - SCROLL_SPEED,
        }));
        
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
        
        return updated.filter((fruit) => fruit.x > -FRUIT_SIZE && !fruit.collected);
      });
      
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    animationFrameId = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPaused]);
  
  // Detectar colisiones
  useEffect(() => {
    if (isPaused || hasCollidedRef.current) return;
    
    // Colisiones con obstáculos
    obstacles.forEach((obs) => {
      const birdLeft = 50;
      const birdRight = 50 + BIRD_SIZE;
      const birdTop = birdY;
      const birdBottom = birdY + BIRD_SIZE;
      
      const obsLeft = obs.x;
      const obsRight = obs.x + OBSTACLE_WIDTH;
      
      if (birdRight > obsLeft && birdLeft < obsRight) {
        if (birdTop < obs.gapY || birdBottom > obs.gapY + OBSTACLE_GAP) {
          if (!hasCollidedRef.current) {
            hasCollidedRef.current = true;
            onCollision();
          }
        }
      }
    });
    
    // Colisiones con frutos
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
  }, [birdY, obstacles, fruits, isPaused, onCollision, onFruitCollected]);
  
  useEffect(() => {
    if (!isPaused) {
      hasCollidedRef.current = false;
    }
  }, [isPaused]);
  
  const birdAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${birdRotation.value}deg` }],
  }));
  
  const getBirdColor = () => {
    if (currentForce >= highZone * 0.8) return "#EF4444";
    if (currentForce >= midZone) return "#F59E0B";
    return "#22C55E";
  };
  
  // Cargar sprites
  const birdSprite = require("@/assets/sprites/bird.png");
  const fruitSprites = [
    require("@/assets/sprites/watermelon.png"),
    require("@/assets/sprites/banana.png"),
    require("@/assets/sprites/apple.png"),
    require("@/assets/sprites/orange.png"),
    require("@/assets/sprites/strawberry.png"),
    require("@/assets/sprites/mandarin.png"),
    require("@/assets/sprites/cherry.png"),
    require("@/assets/sprites/pear.png"),
    require("@/assets/sprites/peach.png"),
  ];
  
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
          },
          birdAnimatedStyle,
        ]}
      >
        <Image
          source={birdSprite}
          style={{ width: BIRD_SIZE, height: BIRD_SIZE, tintColor: getBirdColor() }}
          resizeMode="contain"
        />
      </Animated.View>
      
      {/* Obstáculos */}
      {obstacles.map((obs) => (
        <View key={obs.id}>
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
        
        return (
          <View
            key={fruit.id}
            style={{
              position: "absolute",
              left: fruit.x,
              top: fruit.y,
              width: FRUIT_SIZE,
              height: FRUIT_SIZE,
            }}
          >
            <Image
              source={fruitSprites[fruit.type]}
              style={{ width: FRUIT_SIZE, height: FRUIT_SIZE }}
              resizeMode="contain"
            />
          </View>
        );
      })}
    </View>
  );
}
