import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Platform, Alert, ImageBackground } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { tindeqService, type ForceData, type CalibrationData } from "@/lib/tindeq-service";

type GameMode = "quick" | "total" | "resistance";
type GamePhase = "calibration" | "ready" | "playing" | "rest" | "finished";
type SceneName = "yosemite" | "utah" | "albarracin" | "fontainebleau";

interface SceneConfig {
  name: SceneName;
  title: string;
  dayImage: any;
  nightImage: any;
}

const SCENES: Record<SceneName, SceneConfig> = {
  yosemite: {
    name: "yosemite",
    title: "Yosemite",
    dayImage: require("@/assets/images/yosemite-day.png"),
    nightImage: require("@/assets/images/yosemite-night.png"),
  },
  utah: {
    name: "utah",
    title: "Utah",
    dayImage: require("@/assets/images/utah-day.png"),
    nightImage: require("@/assets/images/utah-night.png"),
  },
  albarracin: {
    name: "albarracin",
    title: "Albarracín",
    dayImage: require("@/assets/images/albarracin-day.png"),
    nightImage: require("@/assets/images/albarracin-night.png"),
  },
  fontainebleau: {
    name: "fontainebleau",
    title: "Fontainebleau",
    dayImage: require("@/assets/images/fontainebleau-day.png"),
    nightImage: require("@/assets/images/fontainebleau-night.png"),
  },
};

// Configuración de modalidades
const MODE_CONFIG = {
  quick: {
    title: "Calentamiento Rápido",
    duration: 180, // 3 minutos
    scenes: ["yosemite"] as SceneName[],
    hasNightTransition: false,
  },
  total: {
    title: "Calentamiento Total",
    duration: 300, // 5 minutos
    scenes: ["yosemite", "utah"] as SceneName[],
    hasNightTransition: true,
    nightAt: 120, // Transición nocturna a los 2 minutos
  },
  resistance: {
    title: "Resistencia",
    duration: 0, // Sin límite de tiempo
    scenes: ["yosemite", "utah", "albarracin", "fontainebleau"] as SceneName[],
    hasNightTransition: true,
    lives: 3,
  },
};

/**
 * Game Screen - Gogor Games
 * 
 * Pantalla principal del juego con soporte para 3 modalidades:
 * - Calentamiento Rápido (3min, 1 escenario)
 * - Calentamiento Total (5min, 2 escenarios + noche)
 * - Resistencia (3 vidas, 4 escenarios + noches)
 */
export default function GameScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const gameMode = (params.mode || "quick") as GameMode;
  const modeConfig = MODE_CONFIG[gameMode];
  
  // Estado de conexión
  const [isConnected, setIsConnected] = useState(false);
  const [batteryVoltage, setBatteryVoltage] = useState<number | null>(null);

  // Estado de calibración
  const [gamePhase, setGamePhase] = useState<GamePhase>("calibration");
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [calibrationForces, setCalibrationForces] = useState<number[]>([]);
  const [calibrationTime, setCalibrationTime] = useState(0);
  
  // Estado del juego
  const [currentForce, setCurrentForce] = useState(0);
  const [maxForceReached, setMaxForceReached] = useState(0);
  const [averageForce, setAverageForce] = useState(0);
  const [forceHistory, setForceHistory] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(modeConfig.duration);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Estado de escenarios
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isNightTransition, setIsNightTransition] = useState(false);
  const [nightTransitionTime, setNightTransitionTime] = useState(0);
  
  // Estado de resistencia
  const [lives, setLives] = useState(modeConfig.lives || 0);

  const currentScene = SCENES[modeConfig.scenes[currentSceneIndex]];

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
          if (prev <= 1) {
            handleGameEnd();
            return 0;
          }
          return prev - 1;
        });
      }

      // Verificar transición nocturna (solo en Total)
      if (gameMode === "total" && timeElapsed === modeConfig.nightAt) {
        startNightTransition();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, timeElapsed]);

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

  // Cronómetro de transición nocturna (10 segundos)
  useEffect(() => {
    if (!isNightTransition || nightTransitionTime === 0) {
      return;
    }

    const timer = setInterval(() => {
      setNightTransitionTime((prev) => {
        if (prev <= 1) {
          endNightTransition();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isNightTransition, nightTransitionTime]);

  const handleForceData = (data: ForceData) => {
    const force = data.weight;
    setCurrentForce(force);

    // Durante calibración, guardar todas las fuerzas
    if (gamePhase === "calibration" && calibrationTime > 0) {
      setCalibrationForces((prev) => [...prev, force]);
    }

    // Durante el juego, actualizar estadísticas
    if (gamePhase === "playing" && !isNightTransition) {
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

      // Calcular fuerza máxima sostenida (promedio del 80% superior)
      const sortedForces = [...calibrationForces].sort((a, b) => b - a);
      const top20Percent = sortedForces.slice(0, Math.ceil(sortedForces.length * 0.2));
      const maxForce = top20Percent.reduce((sum, f) => sum + f, 0) / top20Percent.length;

      // Calcular zonas (0-33%, 33-66%, 66-100%)
      const calibration: CalibrationData = {
        maxForce,
        lowZone: maxForce * 0.33,
        mediumZone: maxForce * 0.66,
        highZone: maxForce,
      };

      setCalibrationData(calibration);
      setGamePhase("ready");

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

    } catch (error) {
      console.error("Error finalizando calibración:", error);
      Alert.alert("Error", "No se pudo completar la calibración.");
    }
  };

  const handleStartGame = async () => {
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
      setMaxForceReached(0);
      setAverageForce(0);
      setForceHistory([]);
      setTimeElapsed(0);

    } catch (error) {
      console.error("Error iniciando juego:", error);
      Alert.alert("Error", "No se pudo iniciar el juego.");
    }
  };

  const startNightTransition = () => {
    setIsNightTransition(true);
    setNightTransitionTime(10);
    setIsPlaying(false);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const endNightTransition = () => {
    setIsNightTransition(false);
    setCurrentSceneIndex((prev) => prev + 1);
    setIsPlaying(true);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleStopGame = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await tindeqService.stopMeasurement();
      setIsPlaying(false);
      setGamePhase("ready");

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
      
      // Navegar a resultados con estadísticas
      router.push({
        pathname: "/results",
        params: {
          mode: gameMode,
          maxForce: maxForceReached.toFixed(1),
          avgForce: averageForce.toFixed(1),
          timeElapsed: timeElapsed.toString(),
        },
      });

    } catch (error) {
      console.error("Error finalizando juego:", error);
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

  // Determinar zona actual
  const getCurrentZone = (): "low" | "medium" | "high" | "none" => {
    if (!calibrationData) return "none";
    if (currentForce < calibrationData.lowZone) return "none";
    if (currentForce < calibrationData.mediumZone) return "low";
    if (currentForce < calibrationData.highZone) return "medium";
    return "high";
  };

  const currentZone = getCurrentZone();

  // Color según zona
  const getZoneColor = () => {
    switch (currentZone) {
      case "low": return "#4ADE80"; // verde
      case "medium": return "#FBBF24"; // amarillo
      case "high": return "#F87171"; // rojo
      default: return colors.muted;
    }
  };

  const backgroundImage = isNightTransition ? currentScene.nightImage : currentScene.dayImage;

  return (
    <ImageBackground
      source={backgroundImage}
      className="flex-1"
      resizeMode="cover"
    >
      <ScreenContainer className="flex-1 p-6" containerClassName="bg-transparent">
        {/* Header: Estado de conexión */}
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={handleBackPress} className="active:opacity-70">
            <Text className="text-white text-lg font-semibold drop-shadow">← Atrás</Text>
          </TouchableOpacity>
          <View className="flex-row items-center">
            <Text className="text-white mr-2 drop-shadow">🔋 {batteryPercent}%</Text>
            <Text className="text-white drop-shadow">{isConnected ? "Bluetooth ✓" : "Desconectado"}</Text>
          </View>
        </View>

        {/* FASE: CALIBRACIÓN */}
        {gamePhase === "calibration" && (
          <View className="flex-1 justify-center items-center">
            <View className="bg-black/60 rounded-3xl p-8 items-center">
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
          <View className="flex-1 justify-center items-center">
            <View className="bg-black/60 rounded-3xl p-8 items-center max-w-md">
              <Text className="text-white text-2xl font-bold text-center mb-4">
                ¡Calibración completa!
              </Text>
              <Text className="text-white/80 text-center mb-2">
                {modeConfig.title}
              </Text>
              <Text className="text-white/60 text-center mb-6">
                Tu fuerza máxima: {calibrationData.maxForce.toFixed(1)} kg
              </Text>

              <View className="bg-white/10 rounded-2xl p-6 mb-8 w-full">
                <Text className="text-white font-semibold mb-3">Zonas de entrenamiento:</Text>
                <View className="gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-white/80">🟢 Zona baja:</Text>
                    <Text className="text-white">0 - {calibrationData.lowZone.toFixed(1)} kg</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-white/80">🟡 Zona media:</Text>
                    <Text className="text-white">{calibrationData.lowZone.toFixed(1)} - {calibrationData.mediumZone.toFixed(1)} kg</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-white/80">🔴 Zona alta:</Text>
                    <Text className="text-white">{calibrationData.mediumZone.toFixed(1)} - {calibrationData.highZone.toFixed(1)} kg</Text>
                  </View>
                </View>
              </View>

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

        {/* FASE: TRANSICIÓN NOCTURNA */}
        {isNightTransition && (
          <View className="flex-1 justify-center items-center">
            <View className="items-center">
              <Text className="text-white text-6xl mb-4">🌙</Text>
              <Text className="text-white text-3xl font-bold mb-2">
                Descansa...
              </Text>
              <Text className="text-white/80 text-xl mb-8">
                Respira profundo
              </Text>
              <Text className="text-white text-5xl font-bold">
                {nightTransitionTime}
              </Text>
            </View>
          </View>
        )}

        {/* FASE: JUGANDO */}
        {gamePhase === "playing" && !isNightTransition && calibrationData && (
          <>
            {/* Título del escenario */}
            <View className="items-center mb-4">
              <Text className="text-white text-xl font-bold drop-shadow">
                {currentScene.title}
              </Text>
            </View>

            {/* Fuerza actual (grande) */}
            <View className="items-center my-8">
              <View 
                className="bg-white/90 border-4 rounded-3xl p-8 shadow-lg"
                style={{ borderColor: getZoneColor() }}
              >
                <Text 
                  className="text-7xl font-bold text-center"
                  style={{ color: getZoneColor() }}
                >
                  {currentForce.toFixed(1)}
                </Text>
                <Text className="text-muted text-xl text-center mt-2">kg</Text>
              </View>
              <Text className="text-white text-sm mt-4 drop-shadow">
                Zona: {currentZone === "none" ? "Ninguna" : currentZone === "low" ? "Baja 🟢" : currentZone === "medium" ? "Media 🟡" : "Alta 🔴"}
              </Text>
            </View>

            {/* Barra de progreso */}
            <View className="mb-6">
              <View className="bg-white/30 h-4 rounded-full overflow-hidden">
                <View
                  className="h-full"
                  style={{ 
                    width: `${Math.min((currentForce / calibrationData.maxForce) * 100, 100)}%`,
                    backgroundColor: getZoneColor(),
                  }}
                />
              </View>
              <Text className="text-white text-sm text-center mt-2 drop-shadow">
                Máximo: {maxForceReached.toFixed(1)} kg | Promedio: {averageForce.toFixed(1)} kg
              </Text>
            </View>

            {/* Cronómetro */}
            <View className="items-center mb-8">
              <Text 
                style={{ color: timeRemaining < 10 ? colors.error : "white" }} 
                className="text-5xl font-bold drop-shadow"
              >
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
              {gameMode === "resistance" && (
                <Text className="text-white text-xl mt-2 drop-shadow">
                  ❤️ {lives} vidas
                </Text>
              )}
            </View>

            {/* Botón detener */}
            <TouchableOpacity
              onPress={handleStopGame}
              className="px-6 py-4 rounded-xl active:opacity-80"
              style={{ backgroundColor: colors.error }}
            >
              <Text className="text-background text-lg font-semibold text-center">
                DETENER
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScreenContainer>
    </ImageBackground>
  );
}
