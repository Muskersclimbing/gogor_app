import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ForcezoneConfig {
  extension: number; // 0-35%
  semiArqueo: number; // 35-70%
  arqueo: number; // 70-100%
}

export interface CustomGame {
  id: string;
  name: string;
  duration: number; // segundos
  forcezones: ForcezoneConfig;
  createdAt: number;
}

const STORAGE_KEY = "custom_games";

export const customGamesService = {
  // Obtener todos los juegos personalizados
  async getAllGames(): Promise<CustomGame[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error al obtener juegos:", error);
      return [];
    }
  },

  // Obtener un juego por ID
  async getGameById(id: string): Promise<CustomGame | null> {
    try {
      const games = await this.getAllGames();
      return games.find((g) => g.id === id) || null;
    } catch (error) {
      console.error("Error al obtener juego:", error);
      return null;
    }
  },

  // Crear nuevo juego
  async createGame(
    name: string,
    durationMinutes: number,
    durationSeconds: number,
    forcezones: ForcezoneConfig,
  ): Promise<CustomGame> {
    try {
      const games = await this.getAllGames();
      const duration = durationMinutes * 60 + durationSeconds;

      const newGame: CustomGame = {
        id: Date.now().toString(),
        name,
        duration,
        forcezones,
        createdAt: Date.now(),
      };

      games.push(newGame);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(games));
      return newGame;
    } catch (error) {
      console.error("Error al crear juego:", error);
      throw error;
    }
  },

  // Actualizar juego
  async updateGame(
    id: string,
    name: string,
    durationMinutes: number,
    durationSeconds: number,
    forcezones: ForcezoneConfig,
  ): Promise<CustomGame | null> {
    try {
      const games = await this.getAllGames();
      const gameIndex = games.findIndex((g) => g.id === id);

      if (gameIndex === -1) return null;

      const duration = durationMinutes * 60 + durationSeconds;
      games[gameIndex] = {
        ...games[gameIndex],
        name,
        duration,
        forcezones,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(games));
      return games[gameIndex];
    } catch (error) {
      console.error("Error al actualizar juego:", error);
      throw error;
    }
  },

  // Eliminar juego
  async deleteGame(id: string): Promise<boolean> {
    try {
      const games = await this.getAllGames();
      const filtered = games.filter((g) => g.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error("Error al eliminar juego:", error);
      return false;
    }
  },

  // Validar configuración de zonas de fuerza
  validateForcezones(forcezones: ForcezoneConfig): boolean {
    const total =
      forcezones.extension + forcezones.semiArqueo + forcezones.arqueo;
    return (
      forcezones.extension >= 0 &&
      forcezones.semiArqueo >= 0 &&
      forcezones.arqueo >= 0 &&
      total === 100
    );
  },
};
