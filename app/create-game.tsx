import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { customGamesService, type ForcezoneConfig } from '@/lib/custom-games-service';

export default function CreateGameScreen() {
  const colors = useColors();
  const router = useRouter();

  const [name, setName] = useState('');
  const [minutesInput, setMinutesInput] = useState('3');
  const [secondsInput, setSecondsInput] = useState('0');
  const [extension, setExtension] = useState('33');
  const [semiArqueo, setSemiArqueo] = useState('33');
  const [arqueo, setArqueo] = useState('34');
  const [loading, setLoading] = useState(false);

  const validateInputs = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el juego');
      return false;
    }

    const minutes = parseInt(minutesInput) || 0;
    const seconds = parseInt(secondsInput) || 0;
    const duration = minutes * 60 + seconds;

    if (duration <= 0) {
      Alert.alert('Error', 'La duración debe ser mayor a 0');
      return false;
    }

    const ext = parseInt(extension) || 0;
    const semi = parseInt(semiArqueo) || 0;
    const arq = parseInt(arqueo) || 0;

    if (ext < 0 || semi < 0 || arq < 0) {
      Alert.alert('Error', 'Los porcentajes no pueden ser negativos');
      return false;
    }

    if (ext + semi + arq !== 100) {
      Alert.alert('Error', `Los porcentajes deben sumar 100% (actualmente: ${ext + semi + arq}%)`);
      return false;
    }

    return true;
  };

  const handleSaveGame = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const minutes = parseInt(minutesInput) || 0;
      const seconds = parseInt(secondsInput) || 0;
      const forcezones: ForcezoneConfig = {
        extension: parseInt(extension) || 0,
        semiArqueo: parseInt(semiArqueo) || 0,
        arqueo: parseInt(arqueo) || 0,
      };

      await customGamesService.createGame(name, minutes, seconds, forcezones);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Éxito', 'Juego creado correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el juego');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const updatePercentage = (field: string, value: string) => {
    const num = parseInt(value) || 0;
    const clamped = Math.max(0, Math.min(100, num));

    if (field === 'extension') setExtension(clamped.toString());
    else if (field === 'semiArqueo') setSemiArqueo(clamped.toString());
    else if (field === 'arqueo') setArqueo(clamped.toString());
  };

  const total = (parseInt(extension) || 0) + (parseInt(semiArqueo) || 0) + (parseInt(arqueo) || 0);
  const totalColor = total === 100 ? colors.success : colors.error;

  return (
    <ScreenContainer className="flex-1 p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Título */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">Crear Juego Nuevo</Text>
          <Text className="text-muted text-sm">Configura tu entrenamiento personalizado</Text>
        </View>

        {/* Nombre */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-2">Nombre</Text>
          <TextInput
            placeholder="Ej: Entrenamiento de fuerza"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            editable={!loading}
          />
        </View>

        {/* Tiempo de partida */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-2">Tiempo de partida</Text>
          <View className="flex-row gap-2 items-center justify-center">
            <View className="flex-1">
              <TextInput
                placeholder="0"
                placeholderTextColor={colors.muted}
                value={minutesInput}
                onChangeText={setMinutesInput}
                keyboardType="number-pad"
                maxLength={3}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-center text-lg"
                editable={!loading}
              />
              <Text className="text-muted text-xs text-center mt-1">Min.</Text>
            </View>

            <Text className="text-foreground text-2xl font-bold">:</Text>

            <View className="flex-1">
              <TextInput
                placeholder="0"
                placeholderTextColor={colors.muted}
                value={secondsInput}
                onChangeText={setSecondsInput}
                keyboardType="number-pad"
                maxLength={2}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-center text-lg"
                editable={!loading}
              />
              <Text className="text-muted text-xs text-center mt-1">Seg.</Text>
            </View>
          </View>
        </View>

        {/* Zonas de Fuerza */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-2">Zonas de Fuerza</Text>
          <Text className="text-muted text-xs mb-4">
            Define el porcentaje de tiempo de partida que quieres transcurrir en cada segmento de carga
          </Text>

          {/* Extensión */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-foreground font-medium">Extensión</Text>
              <Text className="text-muted text-xs">0-35%</Text>
            </View>
            <TextInput
              placeholder="0"
              placeholderTextColor={colors.muted}
              value={extension}
              onChangeText={(val) => updatePercentage('extension', val)}
              keyboardType="number-pad"
              maxLength={3}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-center"
              editable={!loading}
            />
          </View>

          {/* Semi-arqueo */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-foreground font-medium">Semi-arqueo</Text>
              <Text className="text-muted text-xs">35-70%</Text>
            </View>
            <TextInput
              placeholder="0"
              placeholderTextColor={colors.muted}
              value={semiArqueo}
              onChangeText={(val) => updatePercentage('semiArqueo', val)}
              keyboardType="number-pad"
              maxLength={3}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-center"
              editable={!loading}
            />
          </View>

          {/* Arqueo */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-foreground font-medium">Arqueo</Text>
              <Text className="text-muted text-xs">70-100%</Text>
            </View>
            <TextInput
              placeholder="0"
              placeholderTextColor={colors.muted}
              value={arqueo}
              onChangeText={(val) => updatePercentage('arqueo', val)}
              keyboardType="number-pad"
              maxLength={3}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-center"
              editable={!loading}
            />
          </View>

          {/* Total */}
          <View className="bg-surface border border-border rounded-lg p-3 mt-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-muted">Total</Text>
              <Text className="text-lg font-bold" style={{ color: totalColor }}>
                {total}%
              </Text>
            </View>
          </View>
        </View>

        {/* Botones */}
        <View className="gap-3 mt-auto">
          <TouchableOpacity
            onPress={handleSaveGame}
            disabled={loading}
            className="bg-primary px-6 py-4 rounded-xl active:opacity-80"
            style={{ backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-background text-lg font-semibold text-center">
              {loading ? 'Guardando...' : 'Guardar Juego'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCancel}
            disabled={loading}
            className="bg-surface border border-border px-6 py-3 rounded-xl active:opacity-70"
          >
            <Text className="text-foreground text-center font-medium">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
