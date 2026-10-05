import { defineConfig } from "vite";
import path from "path";

export default defineConfig(({ command }) => ({
  // Em desenvolvimento mantemos a raiz em "/". No build de produção,
  // o projeto e publicado em https://<usuario>.github.io/drakoria/.
  base: command === "build" ? "/drakoria/" : "/",
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        batalha: path.resolve(__dirname, "pages/batalha.html"),
        caminhoDrakoria: path.resolve(__dirname, "pages/caminho-drakoria.html"),
        estabelecimentos: path.resolve(__dirname, "pages/estabelecimentos.html"),
        intro: path.resolve(__dirname, "pages/intro.html"),
        inventario: path.resolve(__dirname, "pages/inventario.html"),
        login: path.resolve(__dirname, "pages/login.html"),
        personagens: path.resolve(__dirname, "pages/personagens.html"),
        praca: path.resolve(__dirname, "pages/praca.html"),
      },
    },
  },
  server: {
    port: 5173,
  },
}));
