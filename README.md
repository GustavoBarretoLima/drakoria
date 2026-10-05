# 🏰 Drakoria

[![Jogar agora](https://img.shields.io/badge/%F0%9F%8E%AE_Jogar_agora-GitHub_Pages-2ea44f?style=for-the-badge)](https://gustavobarretolima.github.io/drakoria/)
[![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-blue?logo=github)](https://gustavobarretolima.github.io/drakoria/)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff?logo=vite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socketdotio&logoColor=white)
![Language](https://img.shields.io/github/languages/top/GustavoBarretoLima/drakoria)

**Drakoria** é um RPG online para navegador em desenvolvimento, com combate inspirado em sistemas de turno/ATB, classes distintas, monstros, equipamentos e progressão.

> 🎮 A versão do GitHub Pages possui um **modo demonstração** da primeira batalha. Essa luta roda localmente no navegador e não salva progresso. O modo online completo continua dependendo do backend Socket.IO.

## 🎮 Jogar

Acesse a versão publicada:

**https://gustavobarretolima.github.io/drakoria/**

## ⚔️ Estado atual

Já implementado:

- 3 classes: Guerreiro, Mago e Arqueiro;
- batalhas independentes por jogador;
- ataque, defesa e magia;
- defesa física e defesa mágica;
- chance e dano crítico configuráveis;
- atributo de velocidade preparado para o sistema ATB;
- catálogo de monstros;
- catálogo de equipamentos;
- interface de batalha com HP, mana e atributos defensivos;
- comunicação cliente/servidor com Socket.IO;
- modo demo da primeira batalha no GitHub Pages;
- deploy automático do frontend no GitHub Pages.

Em evolução:

- sistema ATB baseado em `speed`;
- progressão no servidor;
- integração completa de inventário e equipamentos;
- persistência em banco de dados;
- dungeons, quests e conteúdo multiplayer.

## 🧱 Estrutura do projeto

| Pasta | Descrição |
|---|---|
| `client/src` | Cliente TypeScript: batalha, UI, páginas, rede, demo e assets |
| `server/src` | Servidor Node.js/Socket.IO e regras autoritativas do jogo |
| `shared/src` | Tipos, atributos e estruturas compartilhadas entre cliente e servidor |
| `pages` | Páginas HTML do jogo |
| `css` | Estilos da interface |
| `js` | Código legado ainda em migração gradual |
| `img` | Imagens, sprites e recursos visuais |
| `audio` | Áudios e efeitos sonoros |

## 🧩 Tecnologias

- TypeScript 6
- Vite 6
- Node.js
- Socket.IO
- HTML5
- CSS3
- JavaScript

## 🚀 Executar localmente

```bash
# Clone o repositório
git clone https://github.com/GustavoBarretoLima/drakoria.git
cd drakoria

# Instale as dependências
npm install
```

Abra dois terminais.

### Servidor

```bash
npm run server
```

O backend fica disponível em `http://localhost:3001`.

### Cliente

```bash
npm run dev
```

Abra o endereço informado pelo Vite, normalmente `http://localhost:5173`.

## 🌐 Deploy

O frontend é publicado automaticamente no GitHub Pages por GitHub Actions sempre que há atualização na branch `main`.

URL:

**https://gustavobarretolima.github.io/drakoria/**

No GitHub Pages, a primeira batalha usa uma engine de demonstração executada no próprio navegador. Ela permite testar ataque, defesa, magia, crítico e turno inimigo, mas o progresso é descartado ao recarregar a página.

O GitHub Pages continua hospedando apenas arquivos estáticos. Para multiplayer, persistência e batalhas autoritativas, o backend em `server/src` precisa ser hospedado em um serviço compatível com Node.js e WebSocket/Socket.IO.

## 🗺️ Roadmap

### Sprint 3 — ATB / Speed

- transformar `speed` em tempo real de carregamento de ação;
- controlar ordem de turnos pelo servidor;
- preparar barras ATB na interface.

### Próximas etapas

- progressão de XP, nível e ouro no servidor;
- integração inventário → equipamento → atributos → combate;
- persistência e banco de dados;
- sprites genéricos para diferentes monstros;
- quests e dungeons;
- economia e marketplace;
- multiplayer avançado e PvP.

## 🧙 Autor

Desenvolvido por **Gustavo Barreto Lima**  
📧 gustavobarretolima@gmail.com
