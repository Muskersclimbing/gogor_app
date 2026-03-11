import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getDefaultConfig } from "expo/metro-config.js";
import { withNativeWind } from "nativewind/dist/metro/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = getDefaultConfig(__dirname);

export default withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
