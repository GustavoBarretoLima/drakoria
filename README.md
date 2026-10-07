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

- árvore de habilidades e subclasses liberadas através de livros (sprint futuro);
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

## Sprint 8 — Combat Core 2.0

Demo e backend executam as mesmas regras em `shared/src/combat/combatEngine.ts`.
Ataques físicos usam `attack`/`defense`; magia usa `magicPower`/`magicDefense`.
A fórmula de mitigação existente (metade da defesa, dano mínimo 1 e postura
reduzindo o resultado pela metade) foi preservada. Magia do herói custa 10 mana.
Esquiva é rolada antes do dano, vale também contra magia e limita-se a 0–50%;
valores não finitos viram 0. Uma esquiva não consome a postura defensiva.

Guerreiro lidera ataque físico/defesa, Mago poder mágico/mana e Arqueiro
velocidade/crítico/esquiva em todos os níveis. Cajados e equipamentos arcanos
concedem poder mágico; botas de Arqueiro concedem velocidade/esquiva e luvas,
crítico. Itens salvos são atualizados pelo catálogo usando seus IDs originais.

Inimigos alternam ataques básicos com especiais (25% de chance, dois turnos
inimigos de cooldown). Hobgoblin Elite tem 40% de chance de preparar uma
emboscada: ergue o escudo e anuncia o ataque; no próximo turno usa uma estocada
com 35% de dano extra e ignora metade da defesa. A postura defensiva do herói
continua eficaz. O Orc Rei tem 45% de chance de especial; aos 50% de vida entra
uma única vez em fúria (+30% ataque, +25% defesa e +15% poder mágico). Na fase 2
seu especial vira Magia Sombria e o cooldown cai para um turno inimigo.
Especiais inimigas não consomem mana, sendo limitadas pelo cooldown.

O painel da Praça usa os atributos compartilhados e inclui esquiva/crítico;
a Visão da Verdade revela também poder mágico e esquiva do inimigo. Mensagens
de combate anunciam esquivas e preparação do Elite sem adicionar controles.

Validação: `npx tsc --noEmit`, `npm run build` e `npm test`.
O balanceamento preserva HP, mana, velocidade, crítico e mitigação existentes;
reduz o ataque físico do Mago e sua progressão de defesa, mantendo seu dano
mágico inicial. A progressão de defesa do Arqueiro é levemente menor.

## Sprint 9 — Habilidades de Classe

Cada classe tem três habilidades liberadas automaticamente nos níveis 1, 5 e
10. O catálogo compartilhado em `shared/src/combat/classSkills.ts` define
requisitos, custo, cooldown e efeitos; demo e backend usam o mesmo catálogo e
engine. Não há pontos para distribuir ou mudança de classe neste sprint.

| Classe | Habilidade | Nível | Mana | Recuperação (outras ações do herói) |
| --- | --- | --- | --- | --- |
| Guerreiro | Golpe Brutal | 1 | 6 | 1 |
| Guerreiro | Golpe do Guardião | 5 | 8 | 2 |
| Guerreiro | Rompe-armadura | 10 | 12 | 3 |
| Mago | Projétil Arcano | 1 | 10 | 1 |
| Mago | Pulso Gélido | 5 | 14 | 2 |
| Mago | Explosão Arcana | 10 | 24 | 3 |
| Arqueiro | Tiro Preciso | 1 | 6 | 1 |
| Arqueiro | Flecha Perfurante | 5 | 10 | 2 |
| Arqueiro | Disparo Duplo | 10 | 14 | 3 |

O Guerreiro combina dano físico, postura defensiva e perfuração. O Mago usa
`magicPower`; Pulso Gélido zera o ATB inimigo apenas se acertar. O Arqueiro
ganha crítico, perfuração e dois tiros que rolam esquiva/crítico separadamente.
Golpe do Guardião concede postura mesmo se o golpe errar; o próximo dano
recebido é reduzido pela metade. Perfuração vale apenas para o golpe atual.
Cada golpe mantém dano base, mitigação, defesa e críticos do Combat Core 2.0.

Usar uma habilidade consome uma ação e seu custo de mana, mesmo quando o
inimigo esquiva. A recuperação começa depois do uso: cooldown 2 exige duas
outras ações do herói. ATB, tempo parado e turnos inimigos não reduzem esse
contador. Outra habilidade também conta como ação e recebe seu próprio
cooldown. Tentativas de habilidade desconhecida, de outra classe, bloqueada
por nível, sem mana ou em recuperação são rejeitadas sem gastar mana, ATB ou
turno. O backend recebe somente o ID; custos e efeitos enviados pelo cliente
são ignorados. Cooldowns são locais à batalha e recomeçam em zero a cada
encontro. Saves antigos continuam compatíveis, sem migração da progressão.

Abra **Habilidades** na batalha para selecionar uma ação e consultar descrição,
custo, nível e recuperação. O painel começa recolhido, mantém seus controles
durante atualizações do ATB e adapta-se ao celular. A Praça também informa as
habilidades liberadas e seus próximos níveis de desbloqueio.

Validação: `npx tsc --noEmit`, `npm run build` e `npm test` (incluindo
`tests/classSkills.test.ts` para catálogo, regras, efeitos, cooldowns e UI).

A árvore de habilidades será planejada em um sprint futuro, com a ideia de
liberar subclasses através de livros, conforme a direção definida para o jogo.
