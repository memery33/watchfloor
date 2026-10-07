import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  // Vite defaults esbuild.legalComments to "none", which strips Leaflet's
  // /* @preserve */ copyright header. Keep legal comments in the bundle.
  esbuild: {
    legalComments: "eof",
  },
});
