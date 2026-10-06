# 🏰 Drakoria

[![Jogar agora](https://img.shields.io/badge/%F0%9F%8E%AE_Jogar_agora-GitHub_Pages-2ea44f?style=for-the-badge)](https://gustavobarretolima.github.io/drakoria/)
[![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-blue?logo=github)](https://gustavobarretolima.github.io/drakoria/)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff?logo=vite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socketdotio&logoColor=white)
![Language](https://img.shields.io/github/languages/top/GustavoBarretoLima/drakoria)

**Drakoria** é um RPG online para navegador em desenvolvimento, com combate em tempo real baseado em ATB, classes distintas, progressão de personagem, loot, equipamentos, dungeons e monstros com níveis diferentes.

> 🎮 A versão publicada no GitHub Pages roda em **modo demo local**, sem depender do backend para a batalha. Progressão, inventário e equipamentos da demo ficam salvos no `localStorage` do navegador. O modo online autoritativo continua dependendo do backend Socket.IO.

## 🎮 Jogar

Acesse a versão publicada:

**https://gustavobarretolima.github.io/drakoria/**

## ⚔️ Estado atual

Já implementado:

- 3 classes: **Guerreiro, Mago e Arqueiro**;
- combate com **ATB baseado em velocidade**;
- ataque, defesa e magia;
- HP, mana, ataque, defesa, defesa mágica, velocidade e crítico;
- progressão de atributos por nível;
- XP, níveis e ouro;
- overlay de vitória com recompensas e drops;
- overlay de derrota com penalidade de **5% da XP atual** e até **200 de ouro**;
- retorno automático para a Praça após derrota;
- inventário com 20 slots;
- 9 slots de equipamento;
- restrições de item por classe e nível;
- paper doll de equipamentos com tooltips;
- bônus dos equipamentos exibidos no inventário e no status;
- loot com raridades, pesos e preço de venda;
- catálogo de monstros e equipamentos;
- Goblins e Orcs com níveis variáveis;
- mini-boss **Senhor da Guerra Orc Nv.15**;
- armas raras do mini-boss: machado, espada, cajado e arco;
- venda de equipamentos por ouro;
- batalhas independentes por jogador no backend;
- comunicação cliente/servidor com Socket.IO;
- deploy automático do frontend no GitHub Pages.

### Dungeons disponíveis

| Dungeon | Níveis dos monstros | Encontros |
|---|---|---|
| Covil dos Goblins e Orcs | 1–10 | Goblin e Orc, 50% cada |
| Cripta dos Mutantes | 1–10 | Esqueleto Guerreiro e Rato Mutante, 50% cada |
| Acampamento Hobgoblin | 10–15 | Hobgoblin normal 80%, elite 20% |
| Trono do Orc Rei | 15–25 | Orc Rei boss, equipamento elite garantido |

O Hobgoblin Elite usa os mesmos GIFs, com 1,6× HP/ataque/defesa e 2× XP/ouro (antes do arredondamento). As definições são compartilhadas entre demo e servidor. As faixas indicam o nível dos encontros; não há bloqueio de entrada por nível do jogador.

### Lista de equipamentos das dungeons

| Slot | Guerreiro | Mago | Arqueiro (elfo) |
|---|---|---|---|
| Arma | Espada de Ferro | Cajado Rúnico | Arco Longo |
| Armadura | Couraça de Placas | Manto de Seda | Gibão de Couro |
| Mão secundária (shield) | Escudo de Aço | Grimório Arcano | Broquel de Couro |
| Pernas | Grevas de Placas | Calças de Linho | Calças de Couro |
| Botas | Botas de Ferro | Botas de Tecido | Botas do Batedor |
| Luvas | Manoplas de Aço | Luvas de Seda | Luvas do Atirador |
| Anel | Anel de Vigor | Anel Arcano | Anel da Precisão |
| Brinco | Brinco de Bravura | Brinco de Safira | Brinco do Falcão |
| Colar | Medalhão do Guardião | Amuleto da Sabedoria | Pingente do Caçador |

Cada peça existe por nível (1–25) e qualidade: Recruta (comum), Veterano (incomum), Elite (raro), Soberano (épico). O nível exigido é exatamente o do monstro derrotado. Armadura de placas e arma corpo a corpo são exclusivas do Guerreiro; Mago usa tecido e cajado; Arqueiro usa couro e arco. Joias também possuem versões específicas por classe. Os nove slots e as três classes têm chances iguais por drop, sem favorecer a classe que derrotou o monstro.

| Encontro | Chance de equipamento | Raridade após o drop |
|---|---|---|
| Goblin/Orc/Esqueleto/Rato | 35% | Comum 70%, incomum 25%, raro 5% |
| Hobgoblin normal | 45% | Incomum 75%, raro 25% |
| Hobgoblin elite | 85% | Raro 80%, épico 20% |
| Orc Rei boss | 100% | Raro 40%, épico 60% |

“Elite” descreve o conjunto raro/épico, preservando as raridades atuais da UI. O Orc Rei também tem 1% de chance independente de conceder um segundo equipamento: Olho da Verdade, colar lendário de nível 15 para todas as classes. Equipado, revela os atributos dos monstros. Sem ele, a batalha exibe nome, classe e nível do personagem e barras sem números. Os demais encontros concedem no máximo um equipamento. A progressão de atributos usa `1 + (nível - 1) × 0,08`, multiplicada por 1/1,2/1,5/1,85 conforme a qualidade. No combate atual, cajados melhoram ataque (também usado no dano mágico) e mana. Equipamentos antigos continuam no inventário; peças incompatíveis não podem ser usadas nem dar bônus. Itens antigos de ferro/placas e a espada do Senhor da Guerra passam a ser exclusivos do Guerreiro.

Verificação: `npx tsc --noEmit`, `npm run build` e `npx tsx tests/dungeonMonsters.test.ts`.

## 🧱 Estrutura do projeto

| Pasta | Descrição |
|---|---|
| `client/src` | Cliente TypeScript: batalha, UI, páginas, rede, demo, progressão e inventário |
| `server/src` | Servidor Node.js/Socket.IO e regras autoritativas do jogo |
| `shared/src` | Tipos, combate, equipamentos, loot e regras compartilhadas |
| `pages` | Páginas HTML do jogo |
| `css` | Estilos da interface |
| `js` | Código legado e integrações da Praça ainda em migração gradual |
| `img` | Imagens, sprites e recursos visuais |
| `audio` | Áudios e efeitos sonoros |

## 🧩 Tecnologias

- TypeScript 6
- Vite 6
- Node.js
- Socket.IO 4
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

No GitHub Pages, as batalhas usam uma engine de demonstração executada no próprio navegador. O estado de progressão, inventário e equipamentos é persistido localmente no navegador para permitir testar o loop atual do jogo.

O GitHub Pages continua hospedando apenas arquivos estáticos. Para multiplayer, persistência centralizada e batalhas autoritativas, o backend em `server/src` precisa ser hospedado em um serviço compatível com Node.js e WebSocket/Socket.IO.

## 🗺️ Roadmap

### Concluído

- Battle Rooms isoladas por jogador;
- sistema de atributos de combate;
- ATB por velocidade;
- progressão de nível;
- loot, inventário e equipamentos;
- paper doll e status detalhado;
- dungeons Orc por faixa de nível;
- mini-boss Nv.15 e loot raro;
- overlays de vitória e derrota;
- deploy no GitHub Pages.

### Próximas etapas

- adicionar `magicPower` real ao combate e alinhar magia com os bônus dos equipamentos;
- implementar `dodgeChance` no combate;
- skills e árvore de habilidades por classe;
- consumíveis;
- inventário e propriedade de itens autoritativos no servidor;
- persistência em banco de dados;
- mais famílias de monstros, bosses e dungeons;
- quests mais profundas;
- economia, marketplace e multiplayer avançado;
- PvP.

## ⚠️ Estado da arquitetura

A base atual é híbrida: funcionalidades novas estão sendo implementadas principalmente em TypeScript, enquanto partes da Praça e de sistemas antigos ainda utilizam JavaScript legado. A migração está sendo feita gradualmente para evitar reescritas grandes de uma vez.

A versão demo usa `localStorage`, portanto o progresso pode ser alterado manualmente pelo navegador. Persistência segura e propriedade autoritativa de itens ainda fazem parte das próximas etapas do backend.

## 🧙 Autor

Desenvolvido por **Gustavo Barreto Lima**  
📧 gustavobarretolima@gmail.com
