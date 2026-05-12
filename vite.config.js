import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        batalha: path.resolve(__dirname, "pages/batalha.html"),
        intro: path.resolve(__dirname, "pages/intro.html"),
        login: path.resolve(__dirname, "pages/login.html"),
        personagens: path.resolve(__dirname, "pages/personagens.html"),
      },
    },
  },
  server: {
    port: 5173,
  },
});
