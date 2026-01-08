import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Platform, Alert, Dimensions, ImageBackground } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { tindeqService, type ForceData, type CalibrationData } from "@/lib/tindeq-service";
import { FlappyBirdGame, type FlappyBirdGameRef } from "@/components/flappy-bird-game";
import { FruitProgressIndicator } from "@/components/fruit-progress-indicator";
import { useAudioService } from "@/lib/audio-service";
import { customGamesService, type CustomGame } from "@/lib/custom-games-service";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type GameMode = "quick" | "total";
type GamePhase = "calibration" | "ready" | "playing" | "rest" | "finished";
type SceneName = "yosemite" | "monument_valley" | "albarracin" | "fontainebleau";

interface SceneConfig {
  name: SceneName;
  title: string;
  dayImage: any;
  nightImage: any;
}

const SCENES: Record<SceneName, SceneConfig> = {
  yosemite: {
    name: "yosemite",
    title: "Mountain",
    dayImage: require("@/assets/images/yosemite-day.png"),
    nightImage: require("@/assets/images/yosemite-night.png"),
  },
  monument_valley: {
    name: "monument_valley",
    title: "Desert",
    dayImage: require("@/assets/images/utah-day.png"),
    nightImage: require("@/assets/images/utah-night.png"),
  },
  albarracin: {
    name: "albarracin",
    title: "Valley",
    dayImage: require("@/assets/images/albarracin-day.png"),
    nightImage: require("@/assets/images/albarracin-night.png"),
  },
  fontainebleau: {
    name: "fontainebleau",
    title: "Forest",
    dayImage: require("@/assets/images/fontainebleau-day.png"),
    nightImage: require("@/assets/images/fontainebleau-night.png"),
  },
};

// Colores de fondo por escenario
const SCENE_COLORS: Record<SceneName, string> = {
  yosemite: "#87CEEB", // Azul cielo
  monument_valley: "#FFB366", // Naranja desierto
  albarracin: "#D4A574", // Marrón tierra
  fontainebleau: "#90B494", // Verde bosque
};

// Configuración de modalidades
const MODE_CONFIG: Record<GameMode, {
  title: string;
  duration: number;
  fruitGoal: number;
  scenes: SceneName[];
  hasNightTransition: boolean;
  nightAt?: number;
  lives?: number;
}> = {
  quick: {
    title: "Calentamiento Rápido",
    duration: 180, // 3 minutos
    fruitGoal: 15,
    scenes: ["yosemite"] as SceneName[], // Un solo escenario fijo
    hasNightTransition: false,
  },
  total: {
    title: "Calentamiento Total",
    duration: 300, // 5 minutos
    fruitGoal: 25,
    scenes: ["yosemite"] as SceneName[], // Un solo escenario fijo
    hasNightTransition: false, // Sin transiciones nocturnas
  },
};

/**
 * Game Screen - Gogor Games
 * 
 * Pantalla principal del juego con mecánica Flappy Bird
 */
export default function GameScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; gameId?: string }>();
  const gameMode = (params.mode || "quick") as GameMode;
  const [customGame, setCustomGame] = useState<CustomGame | null>(null);
  const [modeConfig, setModeConfig] = useState(MODE_CONFIG[gameMode]);

  // Cargar juego personalizado si existe
  useEffect(() => {
    const loadGame = async () => {
      try {
        if (params.gameId && params.mode === "custom") {
          const game = await customGamesService.getGameById(params.gameId);
          if (game) {
            setCustomGame(game);
            const customModeConfig = {
              title: game.name,
              duration: game.duration,
              fruitGoal: Math.ceil(game.duration / 15),
              scenes: ["yosemite"] as SceneName[],
              hasNightTransition: false,
            };
            setModeConfig(customModeConfig);
          } else {
            console.error("Juego no encontrado:", params.gameId);
            setModeConfig(MODE_CONFIG["quick"]);
          }
        } else {
          setModeConfig(MODE_CONFIG[gameMode]);
        }
      } catch (error) {
        console.error("Error cargando juego personalizado:", error);
        setModeConfig(MODE_CONFIG["quick"]);
      }
    };
    loadGame();
  }, [params.gameId, params.mode, gameMode]);
  
  // Servicio de audio
  const audioService = useAudioService();
  
  // Estado de conexión
  const [isConnected, setIsConnected] = useState(false);
  const [batteryVoltage, setBatteryVoltage] = useState<number | null>(null);

  // Estado de calibración
  const [gamePhase, setGamePhase] = useState<GamePhase>("calibration");
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [calibrationForces, setCalibrationForces] = useState<number[]>([]);
  const [calibrationTime, setCalibrationTime] = useState(0);
  const isCalibrating = useRef(false);
  
  // Estado del juego
  const [currentForce, setCurrentForce] = useState(0);
  const [maxForceReached, setMaxForceReached] = useState(0);
  const [averageForce, setAverageForce] = useState(0);
  const [forceHistory, setForceHistory] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Inicializar timeRemaining cuando modeConfig cambie
  useEffect(() => {
    setTimeRemaining(modeConfig.duration);
  }, [modeConfig.duration]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fruitsCollected, setFruitsCollected] = useState(0);
  
  // Refs para estadísticas finales y referencia al componente del juego
  const finalStatsRef = useRef({ maxForce: 0, avgForce: 0 });
  const finalFruitsRef = useRef(0);
  const finalTimeRemainingRef = useRef(0);
  
  // Inicializar finalTimeRemainingRef cuando modeConfig cambie
  useEffect(() => {
    finalTimeRemainingRef.current = modeConfig.duration;
  }, [modeConfig.duration]);
  const shouldNavigateToResults = useRef(false);
  const gamePhaseRef = useRef<GamePhase>(gamePhase);
  const [forceRerender, setForceRerender] = useState(0);
  const flappyBirdRef = useRef<FlappyBirdGameRef>(null);
  
  // Estado de escenarios - un solo escenario fijo
  const [currentSceneIndex] = useState(0); // Siempre 0, un solo escenario
  
  // Estado de resistencia
  const [lives, setLives] = useState(modeConfig.lives || 0);
  
  useEffect(() => {
    setLives(modeConfig.lives || 0);
  }, [modeConfig.lives]);

  const currentScene = SCENES[modeConfig.scenes[currentSceneIndex]];
  
  // Agregar useEffect para limpiar cuando se desmonte
  useEffect(() => {
    return () => {
      // Limpiar recursos
    };
  }, []);

  // ELIMINADO: useEffect de navegación - ahora se navega directamente desde handleGameEnd

  // Verificar conexión al montar
  useEffect(() => {
    const connected = tindeqService.getIsConnected();
    setIsConnected(connected);
    if (!connected) {
      Alert.alert(
        "No conectado",
        "No hay un dispositivo Tindeq conectado. Por favor, conéctate primero.",
        [
          {
            text: "Volver",
            onPress: () => router.back(),
          },
        ]
      );
      return;
    }

    // Configurar listeners
    tindeqService.onForceData(handleForceData);
    tindeqService.onBatteryData(handleBatteryData);
    tindeqService.onConnectionChange(handleConnectionChange);

    // Leer batería inicial
    tindeqService.readBattery().catch(console.error);

    return () => {
      // Detener medición al salir
      if (isPlaying) {
        tindeqService.stopMeasurement().catch(console.error);
      }
    };
  }, []);

  // Cronómetro del juego
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
      
      if (modeConfig.duration > 0) {
        setTimeRemaining((prev) => {
          const newTime = prev <= 0 ? 0 : prev - 1;
          finalTimeRemainingRef.current = newTime;
          if (newTime <= 0) {
            handleGameEnd();
          }
          return newTime;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Cronómetro de calibración (5 segundos)
  useEffect(() => {
    if (gamePhase !== "calibration" || calibrationTime === 0) {
      return;
    }

    const timer = setInterval(() => {
      setCalibrationTime((prev) => {
        if (prev <= 1) {
          finishCalibration();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, calibrationTime]);

  // Transiciones nocturnas eliminadas - juego continuo

  const handleForceData = (data: ForceData) => {
    const force = data.weight;
    setCurrentForce(force);

    // Durante calibración, guardar todas las fuerzas
    if (isCalibrating.current) {
      setCalibrationForces((prev) => [...prev, force]);
    }

    // Durante el juego, actualizar estadísticas
    if (gamePhase === "playing") {
      if (force > maxForceReached) {
        setMaxForceReached(force);
      }
      
      setForceHistory((prev) => {
        const newHistory = [...prev, force];
        const avg = newHistory.reduce((sum, f) => sum + f, 0) / newHistory.length;
        setAverageForce(avg);
        return newHistory;
      });
    }
  };

  const handleBatteryData = (voltage: number) => {
    setBatteryVoltage(voltage);
  };

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    if (!connected) {
      Alert.alert(
        "Desconectado",
        "Se perdió la conexión con el Tindeq.",
        [
          {
            text: "Volver",
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  const handleStartCalibration = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // Calibrar a cero
      await tindeqService.tare();
      
      // Esperar 1 segundo
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Iniciar medición
      await tindeqService.startMeasurement();

      // Iniciar cronómetro de 5 segundos
      isCalibrating.current = true;
      setCalibrationTime(5);
      setCalibrationForces([]);

    } catch (error) {
      console.error("Error iniciando calibración:", error);
      Alert.alert("Error", "No se pudo iniciar la calibración.");
    }
  };

  const finishCalibration = async () => {
    try {
      // Detener medición
      await tindeqService.stopMeasurement();

      console.log("[DEBUG] Fuerzas capturadas:", calibrationForces.length);
      console.log("[DEBUG] Muestra:", calibrationForces.slice(0, 5));

      // Protección contra array vacío
      if (calibrationForces.length === 0) {
        Alert.alert("Error", "No se capturaron datos de fuerza durante la calibración.");
        setCalibrationTime(0);
        return;
      }

      // Calcular fuerza máxima sostenida (promedio del 80% superior)
      const sortedForces = [...calibrationForces].sort((a, b) => b - a);
      const top20Percent = sortedForces.slice(0, Math.max(1, Math.ceil(sortedForces.length * 0.2)));
      const maxForce = top20Percent.reduce((sum, f) => sum + f, 0) / top20Percent.length;

      console.log("[DEBUG] maxForce calculado:", maxForce);

      // Calcular zonas (0-33%, 33-66%, 66-100%)
      const calibration: CalibrationData = {
        maxForce,
        lowZone: maxForce * 0.33,
        mediumZone: maxForce * 0.66,
        highZone: maxForce,
      };

      console.log("[DEBUG] calibrationData:", calibration);

      isCalibrating.current = false;
      setCalibrationData(calibration);
      setGamePhase("ready");
      gamePhaseRef.current = "ready";

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

    } catch (error) {
      console.error("Error finalizando calibración:", error);
      Alert.alert("Error", "No se pudo completar la calibración.");
    }
  };

  const handleStartGame = async () => {
    // Reproducir música según escenario
    // const scenarioMusic = currentSceneIndex === 0 ? "mountain" : currentSceneIndex === 1 ? "forest" : "desert";
    // audioService.playMusic(scenarioMusic); // Desactivado: usar música del FlappyBirdGame en su lugar
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // Calibrar a cero antes de empezar
      await tindeqService.tare();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Iniciar medición
      await tindeqService.startMeasurement();

      setIsPlaying(true);
      setGamePhase("playing");
      gamePhaseRef.current = "playing";
      setMaxForceReached(0);
      setAverageForce(0);
      setForceHistory([]);
      setTimeElapsed(0);
      setFruitsCollected(0);

    } catch (error) {
      console.error("Error iniciando juego:", error);
      Alert.alert("Error", "No se pudo iniciar el juego.");
    }
  };

  // Funciones de transición nocturna eliminadas - juego continuo

  const handleStopGame = async () => {
    // Detener música
    // audioService.stopMusic(); // Desactivado: música del FlappyBirdGame continúa
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await tindeqService.stopMeasurement();
      setIsPlaying(false);
      handleGameEnd();

    } catch (error) {
      console.error("Error deteniendo juego:", error);
    }
  };

  const handleGameEnd = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await tindeqService.stopMeasurement();
      setIsPlaying(false);
      setGamePhase("finished");
      gamePhaseRef.current = "finished";

      // Obtener estadísticas directamente del componente FlappyBirdGame
      const stats = flappyBirdRef.current?.getStats() || { maxForce: 0, avgForce: 0, minForce: 0 };
      console.log('[game.tsx] Estadísticas obtenidas de FlappyBirdGame:', stats);
      
      // Actualizar refs con los valores correctos
      finalStatsRef.current = {
        maxForce: stats.maxForce,
        avgForce: stats.avgForce,
      };

      console.log('[game.tsx] Navegando a resultados con refs:', {
        maxForce: finalStatsRef.current.maxForce,
        avgForce: finalStatsRef.current.avgForce,
        fruitsCollected,
      });
      
      // Navegar directamente con valores del ref
      // completed=true solo si el tiempo llegó a 0 (ejercicio completo)
      const wasCompleted = modeConfig.duration > 0 ? timeRemaining === 0 : false;
      
      // Calcular tiempo transcurrido correctamente
      const finalTimeElapsed = wasCompleted ? modeConfig.duration : (modeConfig.duration - finalTimeRemainingRef.current);
      
      router.push({
        pathname: "/results",
        params: {
          mode: gameMode,
          maxForce: finalStatsRef.current.maxForce.toFixed(1),
          avgForce: finalStatsRef.current.avgForce.toFixed(1),
          timeElapsed: finalTimeElapsed.toString(),
          fruitsCollected: finalFruitsRef.current.toString(),
          completed: wasCompleted.toString(),
        },
      });

    } catch (error) {
      console.error("Error finalizando juego:", error);
    }
  };

  const handleFruitCollected = () => {
    setFruitsCollected((prev) => {
      const newCount = prev + 1;
      finalFruitsRef.current = newCount;
      return newCount;
    });
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Las frutas solo suman puntos, no terminan el juego
    // El juego solo termina cuando se acaba el tiempo
  };

  const handleCollision = () => {
    // Modo resistance eliminado
    if (false) {
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          handleGameEnd();
        }
        return newLives;
      });
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleBackPress = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (isPlaying) {
      await tindeqService.stopMeasurement();
    }

    router.back();
  };

  // Calcular nivel de batería (estimado: 3000mV = 0%, 4200mV = 100%)
  const batteryPercent = batteryVoltage 
    ? Math.min(Math.max(((batteryVoltage - 3000) / 1200) * 100, 0), 100).toFixed(0)
    : "?";

  const backgroundImage = currentScene.dayImage; // Siempre imagen de día, sin transiciones nocturnas

  return (
    <ImageBackground
      source={backgroundImage}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <ScreenContainer className="flex-1" containerClassName="bg-transparent" safeAreaClassName="bg-transparent" edges={["top", "left", "right"]}>
        {/* FASE: CALIBRACIÓN */}
        {gamePhase === "calibration" && (
          <View className="flex-1 justify-center items-center px-6">
            <View className="bg-black/70 rounded-3xl p-8 items-center max-w-md">
              <Text className="text-white text-2xl font-bold text-center mb-4">
                Calibración
              </Text>
              <Text className="text-white/80 text-center mb-8 px-4">
                Vamos a medir tu fuerza máxima.{"\n\n"}
                Cuando presiones "Iniciar", aplica la máxima fuerza durante 5 segundos.
              </Text>

              {calibrationTime > 0 ? (
                <>
                  <Text className="text-white text-7xl font-bold mb-4">
                    {calibrationTime}
                  </Text>
                  <Text className="text-primary text-xl font-semibold mb-8">
                    ¡Aprieta con fuerza!
                  </Text>
                  <View className="bg-white/90 rounded-3xl p-8">
                    <Text className="text-foreground text-5xl font-bold text-center">
                      {currentForce.toFixed(1)}
                    </Text>
                    <Text className="text-muted text-xl text-center mt-2">kg</Text>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  onPress={handleStartCalibration}
                  className="bg-primary px-8 py-4 rounded-xl active:opacity-80"
                >
                  <Text className="text-background text-lg font-semibold">
                    Iniciar Calibración
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* FASE: LISTO PARA JUGAR */}
        {gamePhase === "ready" && calibrationData && (
          <View className="flex-1 justify-center items-center px-6">
            <View className="bg-black/70 rounded-3xl p-8 items-center max-w-md">
              <Text className="text-white text-2xl font-bold text-center mb-4">
                ¡Calibración completa!
              </Text>
              <Text className="text-white/80 text-center mb-2">
                {modeConfig.title}
              </Text>
              <Text className="text-white/60 text-center mb-6">
                Tu fuerza máxima: {calibrationData.maxForce.toFixed(1)} kg
              </Text>

              <TouchableOpacity
                onPress={handleStartGame}
                className="bg-primary px-8 py-4 rounded-xl active:opacity-80"
              >
                <Text className="text-background text-lg font-semibold">
                  Comenzar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* FASE: JUGANDO */}
        {gamePhase === "playing" && calibrationData && (
          <View className="flex-1">
            {/* UI Top Left: Contador de frutos */}
            <View className="absolute top-4 left-4 z-20">
              <View className="bg-[#F5E6D3]/90 rounded-2xl px-4 py-2">
                <Text className="text-[#5C4A3A] text-2xl font-bold">
                  {fruitsCollected}
                </Text>
              </View>
            </View>

            {/* UI Top Center: Indicador de progreso con fresas - DESHABILITADO */}
            {false && (
              <View className="absolute top-4 left-0 right-0 z-20 items-center">
                <View className="bg-[#F5E6D3]/90 rounded-2xl px-4 py-2">
                  <FruitProgressIndicator
                    collected={fruitsCollected}
                    goal={modeConfig.fruitGoal}
                  />
                </View>
              </View>
            )}

            {/* UI Top Right: Fuerza actual */}
            <View className="absolute top-4 right-4 z-20">
              <View className="bg-[#F5E6D3]/90 rounded-2xl px-4 py-2">
                <Text className="text-[#5C4A3A] text-2xl font-bold">
                  {currentForce.toFixed(1)}Kg
                </Text>
              </View>
            </View>

            {/* UI Bottom Left: Tiempo */}
            <View className="absolute bottom-4 left-4 z-20">
              <View className="bg-[#F5E6D3]/90 rounded-2xl px-4 py-2">
                <Text className="text-[#5C4A3A] text-2xl font-bold">
                  {modeConfig.duration > 0 ? (
                    <>
                      {String(Math.floor(timeRemaining / 60)).padStart(2, "0")}:
                      {String(timeRemaining % 60).padStart(2, "0")}
                    </>
                  ) : (
                    <>
                      {String(Math.floor(timeElapsed / 60)).padStart(2, "0")}:
                      {String(timeElapsed % 60).padStart(2, "0")}
                    </>
                  )}
                </Text>
              </View>
            </View>

            {/* UI Bottom Right: Botón STOP */}
            <View className="absolute bottom-4 right-4 z-20">
              <TouchableOpacity
                onPress={handleStopGame}
                className="bg-white/90 rounded-full w-16 h-16 items-center justify-center active:opacity-70"
              >
                <View className="bg-[#5C4A3A] w-6 h-6 rounded-sm" />
              </TouchableOpacity>
            </View>

            {/* Juego Flappy Bird */}
            <FlappyBirdGame
              ref={flappyBirdRef}
              currentForce={currentForce}
              lowZone={calibrationData?.lowZone || 6.6}
              highZone={calibrationData?.highZone || 20}
              onFruitCollected={handleFruitCollected}
              onGameOver={handleCollision}
              isPaused={!isPlaying}
              onForceStats={(stats) => {
                console.log('[game.tsx] onForceStats recibido:', stats);
                // Guardar en estados para mostrar en UI
                setMaxForceReached(stats.maxForce);
                setAverageForce(stats.avgForce);
                // Guardar en ref para navegación (evita problemas de timing)
                finalStatsRef.current = {
                  maxForce: stats.maxForce,
                  avgForce: stats.avgForce,
                };
                // Activar navegación (el useEffect verificará si gamePhase === "finished")
                shouldNavigateToResults.current = true;
                // Forzar re-render del useEffect
                setForceRerender(prev => prev + 1);
              }}
              onCollision={() => {}}
            />
          </View>
        )}
      </ScreenContainer>
    </ImageBackground>
  );
}
