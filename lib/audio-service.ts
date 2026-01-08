import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// Mapeo de música por escenario
const SCENARIO_MUSIC = {
  mountain: require('@/assets/music/ambient_drone.wav'),
  forest: require('@/assets/music/ethereal_pad.wav'),
  desert: require('@/assets/music/celestial_wash.wav'),
};

const SUCCESS_SOUND = require('@/assets/audio/success.mp3');

class AudioService {
  private musicPlayer: ReturnType<typeof useAudioPlayer> | null = null;
  private sfxPlayer: ReturnType<typeof useAudioPlayer> | null = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Habilitar reproducción en modo silencioso (iOS)
      await setAudioModeAsync({
        playsInSilentMode: true,
      });
      this.initialized = true;
    } catch (error) {
      console.error('Error inicializando audio:', error);
    }
  }

  setMusicPlayer(player: ReturnType<typeof useAudioPlayer>) {
    this.musicPlayer = player;
  }

  setSfxPlayer(player: ReturnType<typeof useAudioPlayer>) {
    this.sfxPlayer = player;
  }

  async playMusic(scenario: 'mountain' | 'forest' | 'desert') {
    if (!this.musicPlayer || Platform.OS === 'web') return;
    
    try {
      const source = SCENARIO_MUSIC[scenario];
      this.musicPlayer.replace(source);
      this.musicPlayer.loop = true;
      this.musicPlayer.volume = 0.6;
      this.musicPlayer.play();
    } catch (error) {
      console.error('Error reproduciendo música:', error);
    }
  }

  stopMusic() {
    if (!this.musicPlayer) return;
    try {
      this.musicPlayer.pause();
    } catch (error) {
      console.error('Error deteniendo música:', error);
    }
  }

  async playSuccess() {
    if (!this.sfxPlayer || Platform.OS === 'web') return;
    
    try {
      this.sfxPlayer.replace(SUCCESS_SOUND);
      this.sfxPlayer.volume = 0.8;
      this.sfxPlayer.play();
    } catch (error) {
      console.error('Error reproduciendo efecto:', error);
    }
  }

  cleanup() {
    try {
      this.musicPlayer?.release();
      this.sfxPlayer?.release();
    } catch (error) {
      console.error('Error limpiando audio:', error);
    }
  }
}

export const audioService = new AudioService();

// Hook para usar el servicio de audio
export function useAudioService() {
  const musicPlayer = useAudioPlayer(SCENARIO_MUSIC.mountain);
  const sfxPlayer = useAudioPlayer(SUCCESS_SOUND);

  useEffect(() => {
    audioService.initialize();
    audioService.setMusicPlayer(musicPlayer);
    audioService.setSfxPlayer(sfxPlayer);

    return () => {
      audioService.cleanup();
    };
  }, [musicPlayer, sfxPlayer]);

  return audioService;
}
