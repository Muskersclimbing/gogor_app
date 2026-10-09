import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  plugins: [
    {
      name: "native-image-stubs",
      // Metro turns static image requires into asset IDs on native platforms.
      transform(code, id) {
        if (!id.endsWith(".tsx")) return;
        return code.replace(
          /require\(["']@\/assets\/[^"']+\.(?:png|gif|wav)["']\)/g,
          "1",
        );
      },
    },
  ],
});
