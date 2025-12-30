import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { tindeqService, type ForceData, type CalibrationData } from "@/lib/tindeq-service";

type GamePhase = "calibration" | "ready" | "playing" | "finished";

/**
 * Game Screen - Gogor Games
 * 
 * Pantalla principal del juego donde:
 * 1. Calibración: El usuario aplica fuerza máxima para determinar zonas
 * 2. Juego: Ejercicios de fuerza con feedback visual en tiempo real
 * 3. Resultados: Estadísticas de la sesión
 */
export default function GameScreen() {
  const colors = useColors();
  const router = useRouter();
  
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
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutos por defecto
  const [isPlaying, setIsPlaying] = useState(false);

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
    if (!isPlaying || timeRemaining <= 0) {
      if (timeRemaining <= 0 && isPlaying) {
        handleGameEnd();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, timeRemaining]);

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

  const handleForceData = (data: ForceData) => {
    const force = data.weight;
    setCurrentForce(force);

    // Durante calibración, guardar todas las fuerzas
    if (gamePhase === "calibration" && calibrationTime > 0) {
      setCalibrationForces((prev) => [...prev, force]);
    }

    // Durante el juego, actualizar máximo alcanzado
    if (gamePhase === "playing" && force > maxForceReached) {
      setMaxForceReached(force);
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

    } catch (error) {
      console.error("Error iniciando juego:", error);
      Alert.alert("Error", "No se pudo iniciar el juego.");
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
      
      // Navegar a resultados
      // TODO: Pasar datos de la sesión
      router.push("/results");

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

  return (
    <ScreenContainer className="flex-1 p-6">
      {/* Header: Estado de conexión */}
      <View className="flex-row justify-between items-center mb-6">
        <TouchableOpacity onPress={handleBackPress} className="active:opacity-70">
          <Text className="text-primary text-lg">← Atrás</Text>
        </TouchableOpacity>
        <View className="flex-row items-center">
          <Text className="text-muted mr-2">🔋 {batteryPercent}%</Text>
          <Text className="text-success">{isConnected ? "Bluetooth ✓" : "Desconectado"}</Text>
        </View>
      </View>

      {/* FASE: CALIBRACIÓN */}
      {gamePhase === "calibration" && (
        <View className="flex-1 justify-center items-center">
          <Text className="text-foreground text-2xl font-bold text-center mb-4">
            Calibración
          </Text>
          <Text className="text-muted text-center mb-8 px-4">
            Vamos a medir tu fuerza máxima para ajustar los ejercicios.{"\n\n"}
            Cuando presiones "Iniciar", aplica la máxima fuerza que puedas sostener durante 5 segundos.
          </Text>

          {calibrationTime > 0 ? (
            <>
              <Text className="text-foreground text-7xl font-bold mb-4">
                {calibrationTime}
              </Text>
              <Text className="text-primary text-xl font-semibold mb-8">
                ¡Aprieta con fuerza!
              </Text>
              <View className="bg-surface border-4 border-primary rounded-3xl p-8">
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
      )}

      {/* FASE: LISTO PARA JUGAR */}
      {gamePhase === "ready" && calibrationData && (
        <View className="flex-1 justify-center items-center">
          <Text className="text-foreground text-2xl font-bold text-center mb-4">
            ¡Calibración completa!
          </Text>
          <Text className="text-muted text-center mb-8 px-4">
            Tu fuerza máxima: {calibrationData.maxForce.toFixed(1)} kg
          </Text>

          <View className="bg-surface rounded-2xl p-6 mb-8 w-full">
            <Text className="text-foreground font-semibold mb-3">Zonas de entrenamiento:</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-muted">🟢 Zona baja:</Text>
                <Text className="text-foreground">0 - {calibrationData.lowZone.toFixed(1)} kg</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">🟡 Zona media:</Text>
                <Text className="text-foreground">{calibrationData.lowZone.toFixed(1)} - {calibrationData.mediumZone.toFixed(1)} kg</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">🔴 Zona alta:</Text>
                <Text className="text-foreground">{calibrationData.mediumZone.toFixed(1)} - {calibrationData.highZone.toFixed(1)} kg</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleStartGame}
            className="bg-primary px-8 py-4 rounded-xl active:opacity-80"
          >
            <Text className="text-background text-lg font-semibold">
              Comenzar Juego
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FASE: JUGANDO */}
      {gamePhase === "playing" && calibrationData && (
        <>
          {/* Fuerza actual (grande) */}
          <View className="items-center my-8">
            <View 
              className="bg-surface border-4 rounded-3xl p-8 shadow-lg"
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
            <Text className="text-muted text-sm mt-4">
              Zona: {currentZone === "none" ? "Ninguna" : currentZone === "low" ? "Baja" : currentZone === "medium" ? "Media" : "Alta"}
            </Text>
          </View>

          {/* Barra de progreso */}
          <View className="mb-6">
            <View className="bg-border h-4 rounded-full overflow-hidden">
              <View
                className="h-full"
                style={{ 
                  width: `${Math.min((currentForce / calibrationData.maxForce) * 100, 100)}%`,
                  backgroundColor: getZoneColor(),
                }}
              />
            </View>
            <Text className="text-muted text-sm text-center mt-2">
              Máximo alcanzado: {maxForceReached.toFixed(1)} kg
            </Text>
          </View>

          {/* Cronómetro */}
          <View className="items-center mb-8">
            <Text 
              style={{ color: timeRemaining < 10 ? colors.error : colors.foreground }} 
              className="text-5xl font-bold"
            >
              {String(Math.floor(timeRemaining / 60)).padStart(2, "0")}:
              {String(timeRemaining % 60).padStart(2, "0")}
            </Text>
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
  );
}
