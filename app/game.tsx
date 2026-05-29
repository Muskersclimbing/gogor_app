import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  ImageBackground,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import { ScreenContainer } from "@/components/screen-container";
import {
  forceDeviceService,
  type ForceData,
  type CalibrationData,
} from "@/lib/force-device-service";
import {
  FlappyBirdGame,
  type FlappyBirdGameRef,
} from "@/components/flappy-bird-game";
import { FruitProgressIndicator } from "@/components/fruit-progress-indicator";
import { customGamesService } from "@/lib/custom-games-service";
import { getModeLabel } from "@/i18n/helpers";

type GameMode = "quick" | "total";
type GamePhase = "calibration" | "ready" | "playing" | "rest" | "finished";
type SceneName =
  | "yosemite"
  | "monument_valley"
  | "albarracin"
  | "fontainebleau";

interface SceneConfig {
  name: SceneName;
  dayImage: number;
  nightImage: number;
}

const SCENES: Record<SceneName, SceneConfig> = {
  yosemite: {
    name: "yosemite",
    dayImage: require("@/assets/images/yosemite-day.png"),
    nightImage: require("@/assets/images/yosemite-night.png"),
  },
  monument_valley: {
    name: "monument_valley",
    dayImage: require("@/assets/images/utah-day.png"),
    nightImage: require("@/assets/images/utah-night.png"),
  },
  albarracin: {
    name: "albarracin",
    dayImage: require("@/assets/images/albarracin-day.png"),
    nightImage: require("@/assets/images/albarracin-night.png"),
  },
  fontainebleau: {
    name: "fontainebleau",
    dayImage: require("@/assets/images/fontainebleau-day.png"),
    nightImage: require("@/assets/images/fontainebleau-night.png"),
  },
};

interface ModeConfig {
  duration: number;
  fruitGoal: number;
  scenes: SceneName[];
  hasNightTransition: boolean;
  nightAt?: number;
  lives?: number;
}

const MODE_CONFIG: Record<GameMode, ModeConfig> = {
  quick: {
    duration: 180,
    fruitGoal: 15,
    scenes: ["yosemite"] as SceneName[],
    hasNightTransition: false,
  },
  total: {
    duration: 300,
    fruitGoal: 25,
    scenes: ["yosemite"] as SceneName[],
    hasNightTransition: false,
  },
};

/**
 * Game Screen - Gogor Games
 *
 * Pantalla principal del juego con mecánica Flappy Bird
 */
export default function GameScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ mode?: string; gameId?: string }>();
  const gameMode = (params.mode || "quick") as GameMode;
  const [modeConfig, setModeConfig] = useState<ModeConfig>(
    MODE_CONFIG[gameMode],
  );
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>("calibration");
  const [calibrationData, setCalibrationData] =
    useState<CalibrationData | null>(null);
  const [calibrationTime, setCalibrationTime] = useState(0);
  const [currentForce, setCurrentForce] = useState(0);
  const [, setMaxForceReached] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(
    MODE_CONFIG[gameMode].duration,
  );
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fruitsCollected, setFruitsCollected] = useState(0);

  const isCalibrating = useRef(false);
  const calibrationForcesRef = useRef<number[]>([]);
  const gamePhaseRef = useRef<GamePhase>("calibration");
  const isFinishingCalibrationRef = useRef(false);
  const isEndingGameRef = useRef(false);
  const finalStatsRef = useRef({ maxForce: 0, avgForce: 0 });
  const finalFruitsRef = useRef(0);
  const finalTimeRemainingRef = useRef(MODE_CONFIG[gameMode].duration);
  const flappyBirdRef = useRef<FlappyBirdGameRef>(null);
  const [currentSceneIndex] = useState(0);

  const applyModeConfig = useCallback((config: ModeConfig) => {
    setModeConfig(config);
    setTimeRemaining(config.duration);
    finalTimeRemainingRef.current = config.duration;
  }, []);

  // Cargar juego personalizado si existe
  useEffect(() => {
    const loadGame = async () => {
      try {
        if (params.gameId && params.mode === "custom") {
          // Convertir gameId a string si es array (Expo Router a veces pasa arrays)
          const gameId = Array.isArray(params.gameId)
            ? params.gameId[0]
            : params.gameId;
          console.log(
            "[GAME] gameId convertido:",
            gameId,
            "tipo:",
            typeof gameId,
          );

          console.log("[GAME] Llamando getGameById");
          const game = await customGamesService.getGameById(gameId);
          console.log("[GAME] Juego encontrado:", game);

          if (game && game.duration && typeof game.duration === "number") {
            const customModeConfig: ModeConfig = {
              duration: Math.max(60, game.duration),
              fruitGoal: Math.ceil(game.duration / 15),
              scenes: ["yosemite"] as SceneName[],
              hasNightTransition: false,
              lives: 0,
            };
            console.log("[GAME] customModeConfig creado:", customModeConfig);
            applyModeConfig(customModeConfig);
            setSessionTitle(game.name || t("game.customGame"));
          } else {
            console.error(
              "Juego inválido o no encontrado:",
              gameId,
              "game:",
              game,
            );
            applyModeConfig(MODE_CONFIG["quick"]);
            setSessionTitle(null);
          }
        } else {
          console.log("[DEBUG] Modo predefinido:", gameMode);
          applyModeConfig(MODE_CONFIG[gameMode]);
          setSessionTitle(null);
        }
      } catch (error) {
        console.error("[GAME] ERROR en loadGame:", error);
        console.error("[GAME] Stack:", (error as any)?.stack);
        applyModeConfig(MODE_CONFIG["quick"]);
        setSessionTitle(null);
      }
    };
    loadGame();
  }, [params.gameId, params.mode, gameMode, t, applyModeConfig]);

  useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);

  const currentScene =
    SCENES[modeConfig?.scenes?.[currentSceneIndex] || "yosemite"];

  // Agregar useEffect para limpiar cuando se desmonte
  useEffect(() => {
    return () => {
      // Limpiar recursos
    };
  }, []);

  // ELIMINADO: useEffect de navegación - ahora se navega directamente desde handleGameEnd

  const finishCalibration = useCallback(async () => {
    try {
      await forceDeviceService.stopMeasurement();

      const capturedForces = calibrationForcesRef.current;

      console.log("[DEBUG] Fuerzas capturadas:", capturedForces.length);
      console.log("[DEBUG] Muestra:", capturedForces.slice(0, 5));

      if (capturedForces.length === 0) {
        isCalibrating.current = false;
        isFinishingCalibrationRef.current = false;
        calibrationForcesRef.current = [];
        Alert.alert(t("common.error"), t("game.alerts.noCalibrationData"));
        setCalibrationTime(0);
        return;
      }

      const sortedForces = [...capturedForces].sort((a, b) => b - a);
      const top20Percent = sortedForces.slice(
        0,
        Math.max(1, Math.ceil(sortedForces.length * 0.2)),
      );
      const maxForce =
        top20Percent.reduce((sum, f) => sum + f, 0) / top20Percent.length;

      console.log("[DEBUG] maxForce calculado:", maxForce);

      const calibration: CalibrationData = {
        maxForce,
        lowZone: maxForce * 0.33,
        mediumZone: maxForce * 0.66,
        highZone: maxForce,
      };

      console.log("[DEBUG] calibrationData:", calibration);

      isCalibrating.current = false;
      isFinishingCalibrationRef.current = false;
      calibrationForcesRef.current = [];
      setCalibrationData(calibration);
      setGamePhase("ready");

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      isCalibrating.current = false;
      isFinishingCalibrationRef.current = false;
      console.error("Error finalizando calibración:", error);
      Alert.alert(t("common.error"), t("game.alerts.calibrationFailed"));
    }
  }, [t]);

  const handleGameEnd = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await forceDeviceService.stopMeasurement();
      isEndingGameRef.current = false;
      setIsPlaying(false);
      setGamePhase("finished");

      const stats = flappyBirdRef.current?.getStats() || {
        maxForce: 0,
        avgForce: 0,
        minForce: 0,
      };
      console.log(
        "[game.tsx] Estadísticas obtenidas de FlappyBirdGame:",
        stats,
      );

      finalStatsRef.current = {
        maxForce: stats.maxForce,
        avgForce: stats.avgForce,
      };

      console.log("[game.tsx] Navegando a resultados con refs:", {
        maxForce: finalStatsRef.current.maxForce,
        avgForce: finalStatsRef.current.avgForce,
        fruitsCollected,
      });

      const wasCompleted =
        modeConfig?.duration && modeConfig.duration > 0
          ? timeRemaining === 0
          : false;

      const finalTimeElapsed = wasCompleted
        ? modeConfig?.duration || 0
        : (modeConfig?.duration || 0) - finalTimeRemainingRef.current;

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
      isEndingGameRef.current = false;
      console.error("Error finalizando juego:", error);
    }
  }, [fruitsCollected, gameMode, modeConfig, router, timeRemaining]);

  // Verificar conexión al montar
  useEffect(() => {
    const connected = forceDeviceService.getIsConnected();
    if (!connected) {
      Alert.alert(
        t("game.alerts.notConnectedTitle"),
        t("game.alerts.notConnectedMessage"),
        [
          {
            text: t("common.goBack"),
            onPress: () => router.back(),
          },
        ],
      );
      return;
    }

    // Configurar listeners
    forceDeviceService.onForceData((data: ForceData) => {
      const force = data.weight;
      setCurrentForce(force);

      if (isCalibrating.current) {
        calibrationForcesRef.current.push(force);
      }

      if (gamePhaseRef.current === "playing") {
        setMaxForceReached((prev) => (force > prev ? force : prev));
      }
    });
    forceDeviceService.onBatteryData((_voltage: number) => {});
    forceDeviceService.onConnectionChange((isConnected: boolean) => {
      if (!isConnected) {
        Alert.alert(
          t("game.alerts.disconnectedTitle"),
          t("game.alerts.disconnectedMessage"),
          [
            {
              text: t("common.goBack"),
              onPress: () => router.back(),
            },
          ],
        );
      }
    });

    // Leer batería inicial
    forceDeviceService.readBattery().catch(console.error);

    return () => {
      forceDeviceService.stopMeasurement().catch(console.error);
    };
  }, [router, t]);

  // Cronómetro del juego
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);

      if (modeConfig?.duration && modeConfig.duration > 0) {
        setTimeRemaining((prev) => {
          const newTime = prev <= 0 ? 0 : prev - 1;
          finalTimeRemainingRef.current = newTime;
          return newTime;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, modeConfig?.duration]);

  useEffect(() => {
    if (!isPlaying || timeRemaining > 0 || isEndingGameRef.current) {
      return;
    }

    isEndingGameRef.current = true;
    void handleGameEnd();
  }, [handleGameEnd, isPlaying, timeRemaining]);

  // Cronómetro de calibración (5 segundos)
  useEffect(() => {
    if (gamePhase !== "calibration" || calibrationTime === 0) {
      return;
    }

    const timer = setInterval(() => {
      setCalibrationTime((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [calibrationTime, gamePhase]);

  useEffect(() => {
    if (
      gamePhase !== "calibration" ||
      calibrationTime !== 0 ||
      !isCalibrating.current ||
      isFinishingCalibrationRef.current
    ) {
      return;
    }

    isFinishingCalibrationRef.current = true;
    void finishCalibration();
  }, [calibrationTime, finishCalibration, gamePhase]);

  const handleStartCalibration = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      isCalibrating.current = true;
      isFinishingCalibrationRef.current = false;
      calibrationForcesRef.current = [];
      setCurrentForce(0);

      // Calibrar a cero
      await forceDeviceService.tare();

      // Esperar 1 segundo
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Iniciar medición
      await forceDeviceService.startMeasurement();

      // Iniciar cronómetro de 5 segundos
      setCalibrationTime(5);
    } catch (error) {
      isCalibrating.current = false;
      isFinishingCalibrationRef.current = false;
      console.error("Error iniciando calibración:", error);
      Alert.alert(t("common.error"), t("game.alerts.calibrationStartFailed"));
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
      await forceDeviceService.tare();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Iniciar medición
      await forceDeviceService.startMeasurement();

      isEndingGameRef.current = false;
      setIsPlaying(true);
      setGamePhase("playing");
      setMaxForceReached(0);
      setTimeElapsed(0);
      setFruitsCollected(0);
    } catch (error) {
      console.error("Error iniciando juego:", error);
      Alert.alert(t("common.error"), t("game.alerts.gameStartFailed"));
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
      await forceDeviceService.stopMeasurement();
      setIsPlaying(false);
      void handleGameEnd();
    } catch (error) {
      console.error("Error deteniendo juego:", error);
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

  const handleCollision = () => {};

  const backgroundImage = currentScene.dayImage;
  const displaySessionTitle =
    sessionTitle ??
    (gameMode === "quick" || gameMode === "total"
      ? getModeLabel(t, gameMode)
      : t("game.customGame"));

  return (
    <ImageBackground
      source={backgroundImage}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <ScreenContainer
        className="flex-1"
        containerClassName="bg-transparent"
        safeAreaClassName="bg-transparent"
        edges={["top", "left", "right"]}
      >
        {/* FASE: CALIBRACIÓN */}
        {gamePhase === "calibration" && (
          <View className="flex-1 justify-center items-center px-6">
            <View className="bg-black/70 rounded-3xl p-8 items-center max-w-md">
              <Text className="text-white text-2xl font-bold text-center mb-4">
                {t("game.calibration.title")}
              </Text>
              <Text className="text-white/80 text-center mb-8 px-4">
                {t("game.calibration.instructions")}
              </Text>

              {calibrationTime > 0 ? (
                <>
                  <Text className="text-white text-7xl font-bold mb-4">
                    {calibrationTime}
                  </Text>
                  <Text className="text-primary text-xl font-semibold mb-8">
                    {t("game.calibration.squeeze")}
                  </Text>
                  <View className="bg-white/90 rounded-3xl p-8">
                    <Text className="text-foreground text-5xl font-bold text-center">
                      {currentForce.toFixed(1)}
                    </Text>
                    <Text className="text-muted text-xl text-center mt-2">
                      {t("game.unitKg")}
                    </Text>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  onPress={handleStartCalibration}
                  className="bg-primary px-8 py-4 rounded-xl active:opacity-80"
                >
                  <Text className="text-background text-lg font-semibold">
                    {t("game.calibration.startButton")}
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
                {t("game.ready.title")}
              </Text>
              <Text className="text-white/80 text-center mb-2">
                {displaySessionTitle}
              </Text>
              <Text className="text-white/60 text-center mb-6">
                {t("game.ready.maxForce", {
                  force: calibrationData.maxForce.toFixed(1),
                })}
              </Text>

              <TouchableOpacity
                onPress={handleStartGame}
                className="bg-primary px-8 py-4 rounded-xl active:opacity-80"
              >
                <Text className="text-background text-lg font-semibold">
                  {t("game.ready.start")}
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
                    goal={modeConfig?.fruitGoal || 15}
                  />
                </View>
              </View>
            )}

            {/* UI Top Right: Fuerza actual */}
            <View className="absolute top-4 right-4 z-20">
              <View className="bg-[#F5E6D3]/90 rounded-2xl px-4 py-2">
                <Text className="text-[#5C4A3A] text-2xl font-bold">
                  {t("game.forceDisplay", {
                    value: currentForce.toFixed(1),
                  })}
                </Text>
              </View>
            </View>

            {/* UI Bottom Left: Tiempo */}
            <View className="absolute bottom-4 left-4 z-20">
              <View className="bg-[#F5E6D3]/90 rounded-2xl px-4 py-2">
                <Text className="text-[#5C4A3A] text-2xl font-bold">
                  {modeConfig?.duration && modeConfig.duration > 0 ? (
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
                console.log("[game.tsx] onForceStats recibido:", stats);
                setMaxForceReached(stats.maxForce);
                finalStatsRef.current = {
                  maxForce: stats.maxForce,
                  avgForce: stats.avgForce,
                };
              }}
              onCollision={() => {}}
            />
          </View>
        )}
      </ScreenContainer>
    </ImageBackground>
  );
}
