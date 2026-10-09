import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  ImageBackground,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
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
import { calculateCalibration, getPlayerColor } from "@/lib/multidevice-game";
import { getModeLabel } from "@/i18n/helpers";

type BuiltInGameMode = "quick" | "total";
type GameMode = BuiltInGameMode | "custom";
type GamePhase = "calibration" | "ready" | "playing" | "rest" | "finished";
type SceneName =
  "yosemite" | "monument_valley" | "albarracin" | "fontainebleau";

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

const MODE_CONFIG: Record<BuiltInGameMode, ModeConfig> = {
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
  const gameMode: GameMode =
    params.mode === "custom" || params.mode === "total" ? params.mode : "quick";
  // Custom workouts load asynchronously, so the first render needs a valid config.
  const initialModeConfig =
    MODE_CONFIG[gameMode === "custom" ? "quick" : gameMode];
  const [modeConfig, setModeConfig] = useState<ModeConfig>(initialModeConfig);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>("calibration");
  const [sessionDevices] = useState(() =>
    forceDeviceService.getConnectedDevices(),
  );
  const [calibrations, setCalibrations] = useState<
    Record<string, CalibrationData>
  >({});
  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const calibrationDevice = sessionDevices[calibrationIndex];
  const calibrationDeviceIdRef = useRef(calibrationDevice?.id);
  useEffect(() => {
    calibrationDeviceIdRef.current = calibrationDevice?.id;
  }, [calibrationDevice?.id]);
  const [calibrationPreparing, setCalibrationPreparing] = useState(false);
  const [startingGame, setStartingGame] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const interruptedRef = useRef(false);
  const [deviceForces, setDeviceForces] = useState<Record<string, number>>({});
  const calibrationData = sessionDevices[0]
    ? calibrations[sessionDevices[0].id]
    : undefined;
  const [calibrationTime, setCalibrationTime] = useState(0);
  const currentForce = deviceForces[calibrationDevice?.id ?? ""] ?? 0;
  const [timeRemaining, setTimeRemaining] = useState(
    initialModeConfig.duration,
  );
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fruitsCollected, setFruitsCollected] = useState(0);

  const isCalibrating = useRef(false);
  const calibrationForcesRef = useRef<number[]>([]);
  const isFinishingCalibrationRef = useRef(false);
  const isEndingGameRef = useRef(false);
  const finalStatsRef = useRef({ maxForce: 0, avgForce: 0 });
  const finalFruitsRef = useRef(0);
  const finalTimeRemainingRef = useRef(initialModeConfig.duration);
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
          applyModeConfig(initialModeConfig);
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
  }, [
    params.gameId,
    params.mode,
    gameMode,
    initialModeConfig,
    t,
    applyModeConfig,
  ]);

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
    const deviceId = calibrationDeviceIdRef.current;
    try {
      await forceDeviceService.stopMeasurement(deviceId);
      if (interruptedRef.current || !deviceId) return;
      const calibration = calculateCalibration(calibrationForcesRef.current);
      isCalibrating.current = false;
      isFinishingCalibrationRef.current = false;
      calibrationForcesRef.current = [];
      if (!calibration) {
        Alert.alert(t("common.error"), t("game.alerts.noCalibrationData"));
        setCalibrationTime(0);
        return;
      }
      setCalibrations((prev) => ({ ...prev, [deviceId]: calibration }));
      if (calibrationIndex + 1 < sessionDevices.length) {
        setCalibrationIndex((prev) => prev + 1);
      } else {
        setGamePhase("ready");
      }
      if (Platform.OS !== "web")
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
    } catch {
      isCalibrating.current = false;
      isFinishingCalibrationRef.current = false;
      Alert.alert(t("common.error"), t("game.alerts.calibrationFailed"));
    }
  }, [calibrationIndex, sessionDevices.length, t]);

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
  useFocusEffect(
    useCallback(() => {
      interruptedRef.current = false;
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
      const unsubscribeForce = forceDeviceService.onForceData(
        (data: ForceData) => {
          if (
            interruptedRef.current ||
            !sessionDevices.some((device) => device.id === data.deviceId)
          )
            return;
          const force = data.weight;
          setDeviceForces((prev) => ({ ...prev, [data.deviceId]: force }));

          if (
            isCalibrating.current &&
            data.deviceId === calibrationDeviceIdRef.current
          ) {
            calibrationForcesRef.current.push(force);
          }
        },
      );
      const unsubscribeConnection = forceDeviceService.onConnectionChange(
        (isConnected: boolean, deviceId: string) => {
          if (
            !isConnected &&
            sessionDevices.some((device) => device.id === deviceId)
          ) {
            interruptedRef.current = true;
            setInterrupted(true);
            isCalibrating.current = false;
            setCalibrationTime(0);
            setIsPlaying(false);
            void forceDeviceService.stopMeasurement().catch(console.error);
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
        },
      );

      // Leer batería inicial
      forceDeviceService.readBattery().catch(console.error);

      return () => {
        interruptedRef.current = true;
        setIsPlaying(false);
        setCalibrationTime(0);
        unsubscribeForce();
        unsubscribeConnection();
        isCalibrating.current = false;
        forceDeviceService.stopMeasurement().catch(console.error);
      };
    }, [router, sessionDevices, t]),
  );

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
    if (
      isCalibrating.current ||
      calibrationPreparing ||
      interrupted ||
      !calibrationDevice
    )
      return;
    setCalibrationPreparing(true);
    if (Platform.OS !== "web")
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      isFinishingCalibrationRef.current = false;
      calibrationForcesRef.current = [];
      setDeviceForces((prev) => ({ ...prev, [calibrationDevice.id]: 0 }));
      await forceDeviceService.tare(calibrationDevice.id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (interruptedRef.current) return;
      await forceDeviceService.startMeasurement(calibrationDevice.id);
      if (interruptedRef.current) {
        await forceDeviceService.stopMeasurement(calibrationDevice.id);
        return;
      }
      // Capture only after tare and stream initialization have finished.
      isCalibrating.current = true;
      setCalibrationTime(5);
    } catch {
      isCalibrating.current = false;
      isFinishingCalibrationRef.current = false;
      Alert.alert(t("common.error"), t("game.alerts.calibrationStartFailed"));
    } finally {
      setCalibrationPreparing(false);
    }
  };

  const handleStartGame = async () => {
    if (
      startingGame ||
      interrupted ||
      sessionDevices.some((device) => !calibrations[device.id])
    )
      return;
    setStartingGame(true);
    if (Platform.OS !== "web")
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await forceDeviceService.tare();
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (interruptedRef.current) return;
      await forceDeviceService.startMeasurement();
      if (interruptedRef.current) {
        await forceDeviceService.stopMeasurement();
        return;
      }
      isEndingGameRef.current = false;
      setIsPlaying(true);
      setGamePhase("playing");
      setTimeElapsed(0);
      setFruitsCollected(0);
      finalFruitsRef.current = 0;
    } catch {
      Alert.alert(t("common.error"), t("game.alerts.gameStartFailed"));
    } finally {
      setStartingGame(false);
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

  const handleFruitCollected = useCallback((count: number) => {
    setFruitsCollected(count);
    finalFruitsRef.current = count;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Las frutas solo suman puntos, no terminan el juego
    // El juego solo termina cuando se acaba el tiempo
  }, []);

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

              {sessionDevices.length > 1 && calibrationDevice && (
                <Text
                  className="text-center font-semibold mb-4"
                  style={{ color: getPlayerColor(calibrationIndex) }}
                >
                  {t("game.calibration.device", {
                    index: calibrationIndex + 1,
                    count: sessionDevices.length,
                    name: calibrationDevice.name,
                  })}
                </Text>
              )}
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
                  disabled={calibrationPreparing || interrupted}
                  style={{
                    opacity: calibrationPreparing || interrupted ? 0.5 : 1,
                  }}
                  className="bg-primary px-8 py-4 rounded-xl active:opacity-80"
                >
                  <Text className="text-background text-lg font-semibold">
                    {calibrationPreparing
                      ? t("game.calibration.preparing")
                      : t("game.calibration.startButton")}
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
              <ScrollView
                style={{ maxHeight: 240 }}
                className="mb-6"
                contentContainerStyle={{ gap: 8 }}
              >
                {sessionDevices.map((device, index) => (
                  <View key={device.id}>
                    {sessionDevices.length > 1 && (
                      <Text
                        className="text-center font-semibold"
                        style={{ color: getPlayerColor(index) }}
                      >
                        {index + 1}. {device.name}
                      </Text>
                    )}
                    <Text className="text-white/60 text-center">
                      {t("game.ready.maxForce", {
                        force:
                          calibrations[device.id]?.maxForce.toFixed(1) ?? "0.0",
                      })}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={handleStartGame}
                disabled={startingGame || interrupted}
                style={{ opacity: startingGame || interrupted ? 0.5 : 1 }}
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
                {sessionDevices.map((device, index) => (
                  <Text
                    key={device.id}
                    className="text-[#5C4A3A] font-bold"
                    style={{ fontSize: sessionDevices.length > 1 ? 16 : 24 }}
                  >
                    {sessionDevices.length > 1 ? `${index + 1}. ` : ""}
                    {t("game.forceDisplay", {
                      value: (deviceForces[device.id] ?? 0).toFixed(1),
                    })}
                  </Text>
                ))}
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
              players={sessionDevices.map((device, index) => ({
                id: device.id,
                color: getPlayerColor(index),
                currentForce: deviceForces[device.id] ?? 0,
                highZone: calibrations[device.id].highZone,
              }))}
              onFruitCollected={handleFruitCollected}
              isPaused={!isPlaying}
            />
          </View>
        )}
      </ScreenContainer>
    </ImageBackground>
  );
}
