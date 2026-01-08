import { Audio } from 'expo-av';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// Mapeo de música por escenario
const SCENARIO_MUSIC = {
  mountain: require('@/assets/audio/background_music.wav'),
  forest: require('@/assets/audio/background_music.wav'),
  desert: require('@/assets/audio/background_music.wav'),
};

const SUCCESS_SOUND = require('@/assets/audio/success.mp3');

class AudioService {
  private musicSound: Audio.Sound | null = null;
  private sfxSound: Audio.Sound | null = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Configurar modo de audio para permitir múltiples sonidos simultáneamente
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        allowsRecordingIOS: false,
      });
      this.initialized = true;
    } catch (error) {
      console.error('Error inicializando audio:', error);
    }
  }

  async playMusic(scenario: 'mountain' | 'forest' | 'desert') {
    if (Platform.OS === 'web') return;
    
    try {
      // Si ya hay música, detenerla
      if (this.musicSound) {
        await this.musicSound.unloadAsync();
      }

      const source = SCENARIO_MUSIC[scenario];
      const { sound } = await Audio.Sound.createAsync(
        source,
        { isLooping: true, volume: 0.4 }
      );
      
      this.musicSound = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Error reproduciendo música:', error);
    }
  }

  stopMusic() {
    if (!this.musicSound) return;
    try {
      this.musicSound.pauseAsync();
    } catch (error) {
      console.error('Error deteniendo música:', error);
    }
  }

  async playSuccess() {
    if (Platform.OS === 'web') return;
    
    try {
      // Si ya hay sfx, detenerlo
      if (this.sfxSound) {
        await this.sfxSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        SUCCESS_SOUND,
        { volume: 0.8 }
      );
      
      this.sfxSound = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Error reproduciendo efecto:', error);
    }
  }

  cleanup() {
    try {
      this.musicSound?.unloadAsync();
      this.sfxSound?.unloadAsync();
    } catch (error) {
      console.error('Error limpiando audio:', error);
    }
  }
}

export const audioService = new AudioService();

// Hook para usar el servicio de audio
export function useAudioService() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      audioService.initialize();
      initializedRef.current = true;
    }

    return () => {
      audioService.cleanup();
    };
  }, []);

  return audioService;
}
