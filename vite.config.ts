import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],

  optimizeDeps: {
    /**
     * Vite's cold-start crawl only sees what the root route imports, because
     * every other route module is loaded on demand. The first navigation then
     * discovers a second batch of dependencies and Vite force-reloads the page
     * to serve them — which on a fresh clone can land mid-hydration, throw
     * "Invalid hook call", and lose whatever was just submitted.
     *
     * Naming the dependencies that only routes and lazily-rendered components
     * reach collapses that into one pre-bundling pass, so the first run of
     * `bun run dev` behaves like every later one.
     */
    include: [
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
      "@tanstack/react-table",
      "better-auth/react",
      "recharts",
    ],
  },
});
