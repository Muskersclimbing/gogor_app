import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      name: "native-image-stubs",
      // Metro turns static image requires into asset IDs on native platforms.
      transform(code, id) {
        if (!id.endsWith(".tsx")) return;
        return code.replace(/require\(["']@\/assets\/[^"']+\.png["']\)/g, "1");
      },
    },
  ],
});
