import React, { useState, useEffect, useRef } from "react";
import { View, Text, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface FlappyBirdGameProps {
  currentForce: number;
  lowZone: number;
  midZone: number;
  highZone: number;
  onFruitCollected: () => void;
  onCollision: () => void;
  isPaused: boolean;
}

/**
 * VERSIÓN DE TEST ULTRA-SIMPLE
 * 
 * Objetivo: Verificar que currentForce llega y que el pájaro puede moverse
 * 
 * Comportamiento:
 * - Cuadrado rojo que representa el pájaro
 * - Si currentForce > lowZone: sube
 * - Si currentForce <= lowZone: baja (gravedad)
 * - Muestra valores de debug en pantalla
 */
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
  const [debugInfo, setDebugInfo] = useState("");
  const frameCount = useRef(0);
  
  // Log inicial
  useEffect(() => {
    console.log("=== FLAPPY BIRD GAME MOUNTED ===");
    console.log("Initial isPaused:", isPaused);
    console.log("Initial currentForce:", currentForce);
    console.log("lowZone:", lowZone);
    setDebugInfo(`MOUNTED - isPaused:${isPaused} force:${currentForce.toFixed(1)}`);
  }, []);
  
  // Game loop simple
  useEffect(() => {
    console.log("=== GAME LOOP SETUP ===");
    console.log("isPaused:", isPaused);
    
    if (isPaused) {
      console.log("GAME IS PAUSED - LOOP NOT STARTING");
      setDebugInfo(`PAUSED - force:${currentForce.toFixed(1)}`);
      return;
    }
    
    console.log("GAME LOOP STARTING");
    
    const interval = setInterval(() => {
      frameCount.current++;
      
      // Log cada 60 frames (1 segundo aprox)
      if (frameCount.current % 60 === 0) {
        console.log(`Frame ${frameCount.current} - force:${currentForce} lowZone:${lowZone} birdY:${birdY}`);
      }
      
      setBirdY((prevY) => {
        let newY = prevY;
        
        // Si hay fuerza suficiente, subir
        if (currentForce > lowZone) {
          newY = prevY - 5; // Subir 5 píxeles
          if (frameCount.current % 30 === 0) {
            console.log(`MOVING UP - force:${currentForce} > lowZone:${lowZone}`);
          }
        } else {
          // Si no, bajar (gravedad)
          newY = prevY + 2; // Bajar 2 píxeles
          if (frameCount.current % 30 === 0) {
            console.log(`FALLING - force:${currentForce} <= lowZone:${lowZone}`);
          }
        }
        
        // Limitar a pantalla
        newY = Math.max(50, Math.min(SCREEN_HEIGHT - 150, newY));
        
        return newY;
      });
      
      setDebugInfo(`PLAYING - force:${currentForce.toFixed(1)} low:${lowZone.toFixed(1)} y:${Math.round(birdY)}`);
    }, 16); // ~60 FPS
    
    return () => {
      console.log("GAME LOOP CLEANUP");
      clearInterval(interval);
    };
  }, [isPaused]); // Solo depende de isPaused
  
  // Log cuando cambia currentForce
  useEffect(() => {
    console.log("Force changed:", currentForce);
  }, [currentForce]);
  
  // Color según fuerza
  const getBirdColor = () => {
    if (currentForce >= highZone * 0.8) return "#EF4444"; // Rojo
    if (currentForce >= midZone) return "#F59E0B"; // Amarillo
    return "#22C55E"; // Verde
  };
  
  console.log(`RENDER - birdY:${birdY} isPaused:${isPaused} force:${currentForce}`);
  
  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, position: "absolute" }}>
      {/* Debug info en pantalla */}
      <View style={{ position: "absolute", top: 10, left: 10, backgroundColor: "rgba(0,0,0,0.7)", padding: 10, borderRadius: 5 }}>
        <Text style={{ color: "white", fontSize: 12, fontFamily: "monospace" }}>
          {debugInfo}
        </Text>
        <Text style={{ color: "white", fontSize: 12, fontFamily: "monospace", marginTop: 5 }}>
          isPaused: {isPaused ? "TRUE" : "FALSE"}
        </Text>
        <Text style={{ color: "white", fontSize: 12, fontFamily: "monospace" }}>
          force: {currentForce.toFixed(2)} kg
        </Text>
        <Text style={{ color: "white", fontSize: 12, fontFamily: "monospace" }}>
          lowZone: {lowZone.toFixed(2)} kg
        </Text>
        <Text style={{ color: "white", fontSize: 12, fontFamily: "monospace" }}>
          birdY: {Math.round(birdY)} px
        </Text>
        <Text style={{ color: "white", fontSize: 12, fontFamily: "monospace" }}>
          frames: {frameCount.current}
        </Text>
      </View>
      
      {/* Pájaro (cuadrado simple) */}
      <View
        style={{
          position: "absolute",
          left: 100,
          top: birdY,
          width: 60,
          height: 60,
          backgroundColor: getBirdColor(),
          borderRadius: 10,
          borderWidth: 3,
          borderColor: "white",
        }}
      />
      
      {/* Indicador visual de fuerza */}
      <View style={{ position: "absolute", right: 20, top: 100, width: 40, height: SCREEN_HEIGHT - 200, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 20 }}>
        <View
          style={{
            position: "absolute",
            bottom: 0,
            width: 40,
            height: `${Math.min(100, (currentForce / (highZone * 1.2)) * 100)}%`,
            backgroundColor: getBirdColor(),
            borderRadius: 20,
          }}
        />
      </View>
    </View>
  );
}
