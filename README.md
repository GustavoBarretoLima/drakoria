# 🏰 Drakoria

[![Jogar agora](https://img.shields.io/badge/%F0%9F%8E%AE_Jogar_agora-GitHub_Pages-2ea44f?style=for-the-badge)](https://gustavobarretolima.github.io/drakoria/)
[![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-blue?logo=github)](https://gustavobarretolima.github.io/drakoria/)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff?logo=vite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socketdotio&logoColor=white)
![Language](https://img.shields.io/github/languages/top/GustavoBarretoLima/drakoria)

**Drakoria** é um RPG online para navegador em desenvolvimento, com combate em tempo real baseado em ATB, classes distintas, progressão de personagem, loot, equipamentos, dungeons e monstros com níveis diferentes.

> 🎮 A versão publicada no GitHub Pages roda em **modo demo local**, sem depender do backend para a batalha. Progressão, inventário e equipamentos da demo ficam salvos no `localStorage` do navegador. O modo online autoritativo continua dependendo do backend Socket.IO.

O modo online ainda recebe dados de personagem do navegador e não possui
autenticação ou save persistente por conta. A [revisão da fronteira de confiança
do Socket.IO](docs/socket-trust-boundary.md) descreve as validações atuais e as
etapas para persistir o progresso no servidor.

A [base PostgreSQL](docs/database.md) já define contas, sessões, personagens e
cópias identificadas de equipamentos. Consulte o guia para subir o banco local
e aplicar migrations; a integração com login e progresso online é a próxima etapa.

## 🎮 Jogar

Acesse a versão publicada:

**https://gustavobarretolima.github.io/drakoria/**

## ⚔️ Estado atual

Já implementado:

- 3 classes: **Guerreiro, Mago e Arqueiro**;
- combate com **ATB baseado em velocidade**;
- ataque físico com `attack`/`defense` e magia com `magicPower`/`magicDefense`;
- HP, mana, ataque, poder mágico, defesa, defesa mágica, velocidade, crítico e esquiva;
- três habilidades por classe, liberadas nos níveis 1, 5 e 10, com custo de mana e recuperação por ações;
- menu de habilidades compacto, inspirado em Final Fantasy, com descrições e retorno aos comandos da batalha;
- IA inimiga com ataques básicos, especiais e cooldowns; Hobgoblin Elite prepara emboscadas e Orc Rei muda de fase aos 50% de vida;
- progressão de atributos por nível;
- XP, níveis até 100 e ouro;
- overlay de vitória com recompensas e drops;
- overlay de derrota com penalidade de **5% da XP atual** e até **200 de ouro**;
- retorno automático para a Praça após derrota com 30% da vida máxima, mantendo a mana restante e permitindo continuar sem ouro; saves antigos com zero HP também recuperam essa vida ao entrar na praça;
- inventário com 20 slots;
- 9 slots de equipamento;
- itens equipados aparecem apenas em Equipamentos; trocar ou desequipar devolve a peça à mochila;
- cópias extras permanecem na mochila e podem ser vendidas, sem vender a última cópia equipada;
- restrições de item por classe e nível;
- paper doll de equipamentos com tooltips;
- bônus dos equipamentos exibidos no inventário e no status;
- loot com raridades, pesos e preço de venda;
- catálogo de monstros e equipamentos;
- Goblins e Orcs com níveis variáveis;
- mini-boss **Senhor da Guerra Orc Nv.15**;
- armas raras do mini-boss: machado, espada, cajado e arco;
- venda de equipamentos por ouro;
- Taberna com descanso e compra de poções de HP e mana para recuperação entre batalhas;
- batalhas independentes por jogador no backend;
- comunicação cliente/servidor com Socket.IO;
- deploy automático do frontend no GitHub Pages.

### Exploração pelo mapa

| Local | Níveis dos monstros | Encontros |
|---|---|---|
| Acampamento Orc | 25–35; boss 40 | Goblin e Orc; boss Senhor da Guerra Orc |
| Cemitério Esquecido | 1–10; boss 15 | Esqueleto Guerreiro e Espectro do Cemitério; boss Coveiro Maldito |
| Pântano Corrompido | 10–20; boss 25 | Rato Mutante e Aranha Pestilenta; boss Hidra da Corrupção |
| Floresta Sombria | 15–30; boss 35 | Lobo Sombrio e Árvore Demoníaca; boss Lobo Mutante |
| Fortaleza do Rei Orc | 35–50; boss 55 | Hobgoblin normal 80%, elite 20%; Orc Rei após cinco vitórias |

O menu da praça abre `pages/mapa.html`, usando a imagem em `img/mapas/arredores_de_drakoria.png`. Os locais têm botões sobre o mapa e uma lista acessível para telas pequenas. Drakoria retorna à praça. Ruínas da Vigília permanece sem encontros.

Cemitério, Pântano e Floresta liberam seus bosses após cinco vitórias, com alerta DANGER. Derrotar o boss conclui a exploração e permite voltar ao mapa. Os novos monstros têm animações de idle, ataque, dano e morte, atributos e recompensas compartilhados entre demo e backend. Monstros normais seguem os drops comuns; bosses garantem equipamento raro ou épico do seu nível.

Cada região inicia sua própria exploração e mantém seus monstros ao continuar. HP, mana, inventário e progresso são preservados; sair após a vitória retorna ao mapa. A derrota continua retornando à praça para recuperação. IDs antigos de dungeon continuam disponíveis para compatibilidade com partidas salvas. Demo e backend usam os mesmos IDs de encontros.

O Hobgoblin Elite usa os mesmos GIFs, com 1,6× HP/ataque/defesa e 2× XP/ouro (antes do arredondamento), além de escudo e emboscada anunciada antes da estocada. As definições são compartilhadas entre demo e servidor. As faixas indicam o nível dos encontros; não há bloqueio de entrada por nível do jogador.

Cada habitat tem sua arena de batalha. No desktop, monstros comuns aparecem um pouco maiores que os heróis e bosses usam uma escala maior; o enquadramento considera a área visível dos sprites para evitar que margens transparentes deixem monstros pequenos. No mobile, as proporções são adaptadas ao espaço disponível.

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

Cada peça existe por nível (1–55) e qualidade: Recruta (comum), Veterano (incomum), Elite (raro), Soberano (épico). O nível exigido é exatamente o do monstro derrotado. Armadura de placas e arma corpo a corpo são exclusivas do Guerreiro; Mago usa tecido e cajado; Arqueiro usa couro e arco. Joias também possuem versões específicas por classe. Os nove slots e as três classes têm chances iguais por drop, sem favorecer a classe que derrotou o monstro.

| Encontro | Chance de equipamento | Raridade após o drop |
|---|---|---|
| Monstros comuns dos habitats (exceto Hobgoblin) | 35% | Comum 70%, incomum 25%, raro 5% |
| Hobgoblin normal | 45% | Incomum 75%, raro 25% |
| Hobgoblin elite | 85% | Raro 80%, épico 20% |
| Bosses dos habitats e Orc Rei | 100% | Raro 40%, épico 60% |

“Elite” descreve o conjunto raro/épico, preservando as raridades atuais da UI. O Orc Rei também tem 1% de chance independente de conceder um segundo equipamento: Olho da Verdade, colar lendário de nível 15 para todas as classes. Equipado, revela os atributos dos monstros. Sem ele, a batalha exibe nome, classe e nível do personagem e barras sem números. Os demais encontros concedem no máximo um equipamento. A progressão de atributos usa `1 + (nível - 1) × 0,08`, multiplicada por 1/1,2/1,5/1,85 conforme a qualidade. Cajados concedem poder mágico e mana; equipamentos de Arqueiro podem conceder velocidade, crítico e esquiva. Equipamentos antigos continuam compatíveis; peças incompatíveis não podem ser usadas nem dar bônus. Itens antigos de ferro/placas e a espada do Senhor da Guerra são exclusivos do Guerreiro.

As quantidades salvas representam todas as cópias possuídas, incluindo a equipada. A mochila mostra apenas as cópias disponíveis, preservando os saves existentes e os bônus de status e combate.

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
| [`tools/sprite-generator`](tools/sprite-generator/README.md) | Ferramenta opcional de sprites; instalação própria com `npm ci` |

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

O cliente usa esse endereço por padrão. Para outro backend, defina `VITE_API_URL` em um arquivo `.env.local` na raiz do projeto e reinicie o Vite.

### Cliente

```bash
npm run dev
```

Abra o endereço informado pelo Vite, normalmente `http://localhost:5173`.

O desenvolvimento local usa o backend. O modo demo é ativado automaticamente no build de produção publicado em `github.io/drakoria/`.

## ✅ Validação

### Personagem de testes

Na criação de personagem, use o nome **Taichou** (maiúsculas/minúsculas e espaços nas extremidades são ignorados). Ele começa com nível mínimo 20, vida/mana completas e os nove equipamentos míticos de nível 20 da classe escolhida já equipados. A preparação preserva outros itens e não duplica o set ao ser executada novamente.

Para esse nome, bosses elegíveis para livros de subclasse têm **100% de chance de conceder um livro**, na demo e no backend. A subclasse do livro continua aleatória; monstros comuns e mini-bosses mantêm as regras atuais. Outros personagens têm chance de **0,5% a 0,9%**, conforme o nível do boss: Cemitério (Nv.15) 0,5%, Pântano (Nv.25) 0,6%, Floresta (Nv.35) 0,7%, Acampamento (Nv.40) 0,75% e Fortaleza (Nv.55) 0,9%. Cada nível acima de 15 acrescenta 0,01 ponto percentual, com teto de 0,9%; bosses antigos abaixo de 15 mantêm 0,5%. A chance é de receber um livro, cuja subclasse é sorteada entre as nove com chances iguais, sem garantia por número de tentativas. Monstros comuns e mini-bosses não dropam livros. O nome é um atalho de testes, sem autenticação ou permissões administrativas de conta.

### Comandos

```bash
npm test
npm run typecheck
npm run build
```

Os testes cobrem combate físico e mágico, esquiva, identidade de classe, especiais inimigos, fase do Orc Rei, habilidades e cooldowns, encontros e bosses por habitat, loot, mapa, navegação, consumíveis, recuperação após derrota e inventário/equipamentos.

Para executar apenas um teste, por exemplo o fluxo de equipar e desequipar:

```bash
npx tsx tests/inventoryBackpack.test.ts
```

## 🌐 Deploy

O frontend é publicado automaticamente no GitHub Pages por GitHub Actions sempre que há atualização na branch `main`.

O workflow executa instalação, verificação de tipos, testes e build antes da publicação. PRs destinados à `main` passam pelas mesmas verificações, sem publicar o site. O upload e o deploy só ocorrem na `main`, após todas as verificações passarem; a execução manual em outra branch apenas valida o projeto.

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
- separação visual entre mochila e equipamentos, com proteção da cópia equipada;
- paper doll e status detalhado;
- Combat Core 2.0: poder mágico, esquiva, identidade de classe e IA especial;
- habilidades de classe e menu de batalha compacto;
- exploração pelo mapa, arenas regionais e bosses por habitat;
- poções de HP/mana e recuperação após derrota;
- mini-boss Nv.15 e loot raro;
- overlays de vitória e derrota;
- deploy no GitHub Pages.

### Próximas etapas

- expansão das árvores de subclasse, captura permanente de espíritos e evolução de companheiros;
- expansão dos consumíveis e seus efeitos;
- inventário e propriedade de itens autoritativos no servidor;
- persistência em banco de dados;
- mais famílias de monstros, bosses e dungeons;
- quests mais profundas;
- economia, marketplace e multiplayer avançado;
- PvP.

## ⚠️ Estado da arquitetura

A base atual é híbrida: funcionalidades novas estão sendo implementadas principalmente em TypeScript, enquanto partes da Praça e de sistemas antigos ainda utilizam JavaScript legado. A migração está sendo feita gradualmente para evitar reescritas grandes de uma vez.

A versão demo usa `localStorage`, portanto o progresso pode ser alterado manualmente pelo navegador. Persistência segura e propriedade autoritativa de itens ainda fazem parte das próximas etapas do backend.

O carregamento valida os campos de progresso, HP e mana. Saves antigos com campos ausentes continuam compatíveis; limites de XP inválidos são recuperados pela curva do nível salvo, e valores válidos são preservados. O cliente TypeScript e a API legada da Praça usam o mesmo cálculo de recompensas, com nível máximo 100. No limite, XP e ouro continuam acumulando até o maior inteiro seguro. Ler um save válido não o regrava; campos recuperados são persistidos na próxima gravação.

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
continua eficaz. O Orc Rei entra uma única vez em fúria aos 50% de vida
(+30% ataque, +25% defesa e +15% poder mágico). Sua magia de sangramento
é liberada aos 30% de HP, com intervalo de três ações inimigas.
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

A continuação desse sistema usa livros de subclasse e árvores de talentos, descritos abaixo.

## Árvores de habilidades das subclasses

Após usar um livro compatível, a tela de **Status** mostra o botão **Subclasse**. O Berserk tem 18 nós em três caminhos e nove habilidades ativas. As outras oito subclasses mantêm três talentos passivos e três habilidades ativas. Os talentos adicionam bônus sobre os atributos já calculados com nível, equipamento e subclasse. No Berserk, o antigo bônus automático de dano crítico foi removido; permanecem +20% ATQ e −10% DEF.

O personagem recebe **1 ponto por nível após o primeiro**, incluindo níveis anteriores ao livro. Um personagem de nível 20 tem 19 pontos. Cada aprendizado ou rank custa um ponto. No Berserk, os nós têm grau único; nas outras subclasses, talentos passivos têm até cinco ranks e habilidades, três. Não existe saldo de pontos separado no save: os pontos livres são calculados pelo nível menos os ranks válidos investidos. Saves antigos recebem pontos retroativamente e começam com árvore vazia.

| Subclasse | Talentos passivos | Novas habilidades |
|---|---|---|
| Paladino | Vitalidade Sagrada, Armadura da Fé, Égide Divina | Luz Restauradora, Golpe Consagrado, Santuário |
| Berserk | Lâmina Voraz, Ferida Profunda, Instinto Selvagem, Fúria Crescente, Êxtase de Batalha, Pele de Ferro, Vigor Indomável, Retaliação, Recusar a Morte | Golpe Brutal, Corte Devastador, Turbilhão Selvagem, Executor, Grito de Guerra, Investida Feral, Avatar da Fúria, Sangue por Sangue, Titã Imortal |
| Espadachim | Ritmo da Lâmina, Precisão do Duelista, Passo Evasivo | Corte Duplo, Riposta, Dança das Espadas |
| Necromante | Domínio das Almas, Reservatório Espiritual, Véu dos Mortos | Drenar Vida, Invocar Espírito, Legião Espectral |
| Bruxo | Pacto Sombrio, Vigor do Pacto, Olhar Maldito | Maldição da Fraqueza, Chama Profana, Colheita Sombria |
| Elemental | Afinidade Elemental, Fluxo Arcano, Condutor de Raios | Incendiar, Prisão de Gelo, Tempestade Elemental |
| Assassino | Passos Silenciosos, Ponto Vital, Lâmina Letal | Corte Sangrento, Ataque das Sombras, Finalizar |
| Caçador | Olho de Águia, Reflexos da Caça, Passo do Rastreador | Investida do Falcão, Armadilha de Contenção, Caçada Coordenada |
| Elfo Negro | Precisão Noturna, Poder do Eclipse, Arsenal Sombrio | Flecha Maldita, Sifão do Crepúsculo, Eclipse |

Todas as árvores seguem uma raiz e dois caminhos que se reencontram na habilidade final:

- Raiz: talento passivo, disponível no nível 1; investir exige pontos, portanto começa no nível 2.
- Caminho de habilidades: primeira habilidade no nível 5, exige raiz rank 1; segunda no nível 10, exige primeira rank 2.
- Caminho de atributos: segundo talento no nível 5, exige raiz rank 2; terceiro no nível 10, exige segundo rank 3.
- Habilidade final: nível 20, exige segunda habilidade rank 2 e terceiro talento rank 2.

A tela informa bônus por rank, custo de mana, recuperação, pré-requisitos e motivo de bloqueio. Habilidades aprendidas entram no menu compacto **Habilidades** junto das três habilidades da classe base. Ranks adicionais aumentam o multiplicador de dano em 0,1; habilidades de cura aumentam a cura em três pontos percentuais da vida máxima por rank adicional. Custos de mana e recuperação permanecem fixos.

As novas ações incluem cura, proteção, drenagem de vida, sacrifício de HP, execução contra alvos com até 30% de vida, golpes múltiplos, sangramento/queimadura, ataques temporários de espírito ou falcão, enfraquecimento e interrupção do ATB. Dano contínuo e invocações atuam por três turnos inimigos. Há um efeito de dano contínuo/companheiro por alvo; reaplicar substitui o anterior. Maldição reduz o dano direto inimigo em 20% durante três turnos. Captura permanente de almas e evolução de companheiros continuam como expansão futura.

**Redistribuir pontos** devolve todos os pontos gratuitamente na cidade, sem consumir outro livro nem trocar a subclasse. A mudança atualiza limites de HP/mana sem curar gratuitamente. Builds são copiadas ao iniciar uma batalha; redistribuir não altera uma batalha já iniciada. Demo e backend aplicam o mesmo catálogo e validam níveis, ranks, pré-requisitos e orçamento; atributos, custos e efeitos enviados pelo cliente não são usados como regras. Persistência e propriedade da subclasse continuam locais, conforme a arquitetura atual.

O desenho foi inspirado na combinação de habilidades e talentos passivos das [especializações de Guild Wars 2](https://help.guildwars2.com/hc/en-us/articles/4417183530387-Using-Elite-Specializations) e nas opções de construção de personagem descritas pela [Blizzard para Diablo IV](https://news.blizzard.com/en-us/article/23938756/make-sanctuary-yoursplay-your-way-in-diablo-iv). Nomes, números e árvores são próprios do Drakoria.

Validação: `npm test`, `npx tsc --noEmit` e `npm run build`. `tests/subclassSkillTrees.test.ts` cobre as nove árvores, 27 habilidades, pré-requisitos, orçamento, livros, persistência, redistribuição, efeitos, vitórias por dano contínuo, paridade demo/backend e botão no status. O teste de habilidades também verifica as novas ações no menu de batalha.


### Habilidades dos bosses regionais

Após perderem 70% da vida (HP igual ou inferior a 30% do máximo), os bosses abaixo usam uma magia a cada três ações do inimigo: Hidra da Corrupção aplica Veneno, Lobo Mutante aplica Sangramento, Senhor da Guerra Orc aplica Quebra-osso e Orc Rei aplica Sangramento. O Coveiro Maldito mantém sua IA anterior.

Veneno e Sangramento causam dano nas próximas três ações válidas do jogador. Quebra-osso impede habilidades e magia por duas ações; ataque básico, defesa e itens continuam disponíveis. Comandos rejeitados não avançam os efeitos. Esquivar da magia evita seu efeito. A fase 2 do Orc Rei continua aos 50% de HP, com bônus aplicados uma única vez; a magia de sangramento começa aos 30%.


### Berserk — Fúria e três caminhos

Despertar é gratuito. Os 18 nós de habilidades têm grau único e custam 1 ponto: os caminhos Carnificina, Fúria Primal e Sangue de Ferro progridem independentemente nos níveis 1, 3, 5, 8, 12 e 15, exigindo apenas o nó anterior do mesmo caminho. Não é necessário aprender os outros 15 talentos para escolher uma final: um caminho completo custa seis pontos e sua final exige nível 15. Só uma final é permitida, mas talentos dos demais caminhos podem ser aprendidos. Na cidade, equipam-se até quatro ativas, com espaços vazios permitidos. Passivas aprendidas permanecem aplicadas. A batalha recebe uma cópia da build; demo e backend validam os mesmos requisitos. IDs, custos, efeitos e builds anteriormente válidas são preservados.

Carnificina reúne golpes físicos, sangramento e Executor; seus atributos opcionais são Força Primal e Impacto Selvagem. Fúria Primal reúne geração de Fúria, velocidade, críticos e Avatar; seus atributos são Ritmo da Fúria e Precisão Brutal. Sangue de Ferro reúne resistência, cura, retaliação e Titã; seus atributos são Corpo de Aço e Armadura de Sangue. A primeira linha de atributos exige apenas o despertar e nível 5; a segunda exige nível 20 e rank 2 no atributo anterior. Atributos têm três ranks e compartilham o orçamento de pontos com habilidades.

A revisão segue a identidade de agressão, geração de recurso e sobrevivência em combate descrita no [Berserker oficial de Guild Wars 2](https://www.guildwars2.com/en-gb/news/meet-the-berserker-warriors-elite-specialization/) e no [resumo do combate](https://www.guildwars2.com/en-gb/news/the-berserker-on-points-of-interest-a-summary/), mantendo machado, Fúria, sangramento e alvo único próprios do Drakoria. `tests/berserkPaths.test.ts` verifica os três caminhos sem investimentos obrigatórios fora deles, níveis, finais, saves, habilidades e paridade demo/backend.

Saves antigos recebem todos os pontos de volta, preservando nível, livros, subclasse e recursos atuais. A arma antiga e a mão secundária voltam para a mochila; um machado exclusivo de duas mãos mantém nível, raridade e bônus da arma original. O escudo não contribui. Sem arma, é concedido um machado de nível 1. A migração não duplica machados ao recarregar. Drops de armas de Guerreiro passam a ser machados para Berserk.

Fúria inicia em zero por batalha, vai até 100, não persiste e não é recuperada por poções de mana. Acerto básico gera 8; dano direto recebido gera 4 por ação inimiga. Instinto Selvagem aumenta a geração em 20%, mantendo decimais. As nove ativas usam Fúria, e as habilidades antigas de Guerreiro e magia básica ficam indisponíveis. A barra de mana da batalha exibe Fúria.

Tempos são contados por ações aceitas do personagem, inclusive itens, sem expirar durante a escolha no menu. Sangramento dura duas ações, causando 30% do ataque por ação. Grito, Sangue por Sangue e Titã duram duas ações seguintes; Avatar, três. Fúria Crescente e Retaliação expiram em duas ações; Retaliação só rearma após uma ação sua. Investida reduz o ritmo do ATB inimigo em 40% até a próxima ação dele.

Recargas exigem outras ações: Golpe Brutal 2, Corte Devastador 3, Turbilhão 4, Executor 10, Grito de Guerra 6, Investida 3, Sangue por Sangue 6, Avatar 12 e Titã 12. Corte e Turbilhão atingem o alvo único atual; Turbilhão mantém quatro golpes com esquiva e crítico independentes. Cura por dano desses dois é dividida por três. Cura usa dano efetivo, sem excesso sobre a vida restante. Sangramento renova sem acumular e não causa crítico nem roubo de vida. Recusar a Morte funciona uma vez por batalha, contra dano direto ou contínuo, com proteção até a próxima ação. Empurrões e execuções explícitas ficam para quando essas mecânicas existirem.

Referência visual e especificação: `img/subclass/arvore_berserk/`. `tests/berserkTree.test.ts` cobre os 18 nós, nove ativas, pré-requisitos, finais, equipamentos, migração, Fúria, efeitos e paridade de combate.


### Talentos adicionais de atributos

Todas as nove subclasses têm seis novos talentos (54 no total), com três ranks e custo de um ponto por rank. A primeira linha exige nível 5 e a raiz aprendida; a segunda exige nível 20 e rank 2 no talento anterior da mesma coluna. Os IDs, habilidades, investimentos e ranks antigos são preservados. Pontos continuam sendo um por nível; atributos competem com habilidades pelo mesmo orçamento. No Berserk, cada caminho usa nível e talento anterior, e os atributos da primeira linha exigem somente despertar e nível 5.

| Subclasse | Foco dos novos talentos |
| --- | --- |
| Paladino | Defesa física/mágica, HP, ataque físico e mana |
| Berserk | Ataque físico, HP, velocidade, dano crítico, defesa e crítico |
| Espadachim | Ataque físico, defesa, velocidade, dano crítico, HP e esquiva |
| Necromante | Poder mágico, HP, mana e defesa física/mágica |
| Bruxo | Poder mágico, mana, defesa mágica, dano crítico, HP e crítico |
| Elemental | Poder mágico, mana, velocidade, crítico e defesa mágica |
| Assassino | Ataque físico, esquiva, velocidade, dano crítico, HP e crítico |
| Caçador | Ataque físico, HP, velocidade, crítico, defesa e esquiva |
| Elfo Negro | Ataque físico, poder mágico, velocidade, crítico, mana e defesa mágica |

Força corresponde a ataque físico; magia corresponde a `magicPower`. Bônus de ataque/defesa/HP/mana/magia são percentuais sobre o atributo antes da árvore (já com equipamentos e subclasse), somados sem multiplicação entre talentos. Crítico, dano crítico e esquiva usam pontos percentuais. Valores por rank variam entre 1 e 3; cada nó descreve seu limite. Esquiva continua limitada a 50% e chance crítica a 100%. Novos talentos não adicionam habilidades ao menu de combate. Demo, backend e status usam os mesmos dados.

Referências de identidade: [profissões](https://www.guildwars2.com/en/the-game/professions/) e [especializações](https://heartofthorns.guildwars2.com/game/specializations/) oficiais de Guild Wars 2. Os valores e nomes são próprios do Drakoria, adaptados ao combate com alvo único. `tests/attributeTalents.test.ts` cobre ranks, pré-requisitos, aplicação de bônus, orçamento, preservação de saves e paridade demo/backend.


### Taichou — troca de especialização para testes

O personagem de teste Taichou (nome sem distinção de maiúsculas e espaços nas extremidades) tem o botão **Resetar subclasse (ADM)** na tela de livros e na árvore. Resetar limpa a especialização, ranks e habilidades equipadas, devolvendo o orçamento de pontos, sem consumir ou devolver livros. Nível, XP, ouro, itens e livros restantes são preservados. Equipamentos exclusivos incompatíveis voltam à mochila e recursos são ajustados sem cura gratuita.

Após resetar, Taichou pode usar qualquer livro que possua, independentemente da classe atual. A classe base é ajustada à especialização para manter atributos, habilidades, animações e regras de equipamento corretos no status, demo e backend. Equipamentos incompatíveis voltam à mochila; Berserk e Assassino mantêm suas regras de machado/adagas, com arma inicial quando necessário. A prévia de outra classe considera a nova base e equipamentos compatíveis. Os demais personagens continuam com escolha permanente e livros restritos à classe.

`tests/taichouSubclassReset.test.ts` valida as nove escolhas, restrição aos demais personagens, consumo de livros, reset, itens míticos preservados, recursos e paridade demo/backend. A permissão continua sendo a identidade local de teste existente, sem autenticação administrativa adicional.

### Missões regionais e loja de poções

O interior da Guilda dos Aventureiros oferece 15 missões nas cinco regiões: contratos repetíveis para cinco derrotas e três equipamentos obtidos em drops, além de uma missão única por boss. Aceite antes de lutar; derrotas, drops anteriores e eventos duplicados não contam. A coleta mantém os equipamentos na mochila. Entregue os bosses em ordem para avançar na campanha de missões. Cada entrega concede XP e ouro; bosses também concedem uma arma épica da classe/subclasse no nível regional do boss. A exploração existente continua disponível conforme suas regras atuais.

### Ranks e reputação da Guilda

O aventureiro começa no rank **F**. Contratos novos exigem o rank da região e o nível já previsto; explorar o mapa continua livre pelas regras existentes. Missões aceitas antes desta atualização continuam válidas. A reputação só é recebida ao entregar a missão, junto das recompensas atuais.

| Região dos contratos | Rank exigido | Promoção ao entregar o boss | Reputação de caça / coleta / boss | Reputação total mínima da promoção |
| --- | --- | --- | --- | ---: |
| Cemitério Esquecido | F | E — Coveiro Maldito | 10 / 8 / 60 | 60 |
| Pântano Corrompido | E | D — Hidra da Corrupção | 15 / 12 / 100 | 160 |
| Floresta Sombria | D | C — Lobo Mutante | 20 / 16 / 140 | 300 |
| Acampamento Orc | C | B — Senhor da Guerra Orc | 25 / 20 / 180 | 480 |
| Fortaleza do Rei Orc | B | A — Orc Rei | 30 / 24 / 220 | 700 |

As promoções seguem a campanha: aceite o contrato, derrote o boss regional e entregue na Guilda. Reputação de contratos repetíveis não permite pular bosses. As cinco entregas de boss já fornecem reputação suficiente para promover, sem exigir repetição de contratos. O quadro exibe rank, reputação, próxima promoção e destaca recompensas pendentes.

Use **Acompanhar na exploração** em uma missão ativa. O resumo na batalha mostra a contagem; abra-o para consultar o objetivo. A última missão aceita passa a ser acompanhada, e outra missão ativa assume quando a atual é entregue. O tracker também avisa quando a recompensa está disponível na Guilda.

Rank e reputação são derivados das entregas salvas em `drakoriaQuests`, sem apagar ou reiniciar progresso. Entregas antigas sem contador recebem uma entrega reconhecida; repetir um contrato preserva a reputação anterior. O caminho comum de recompensas mantém o acompanhamento funcionando tanto na demo quanto nas batalhas online; a persistência segue local, sem criar conta autenticada de Guilda no backend.

`tests/guildProgression.test.ts` cobre ranks F–A, promoções, bloqueios, saves antigos, contratos repetidos, derrotas, duplicações e seleção do tracker.

A loja mostra preço, efeito e estoque de todos os 16 consumíveis:

| Poção | Ouro | Efeito |
| --- | ---: | --- |
| HP / HP Média / HP Grande | 5 / 15 / 35 | 40 / 120 / 300 HP |
| Mana / Mana Média / Mana Grande | 5 / 15 / 35 | 20 / 60 / 150 mana |
| Restauradora | 10 | 40 HP e 20 mana |
| Restauradora Superior | 45 | 50% dos máximos de HP e mana |
| Elixir | 100 | HP e mana completos |
| Antídoto | 12 | Remove Veneno |
| Hemostática | 12 | Remove Sangramento |
| Purificadora | 20 | Remove dano contínuo e Quebra-osso |
| Força / Defesa / Arcana | 25 cada | +15% ataque / defesa / poder mágico |
| Agilidade | 35 | +15% velocidade |

As poções de atributos duram três ações do herói após o uso e não acumulam. Usar um item em combate consome o turno. Curas respeitam o máximo, não ressuscitam e não restauram Fúria. Um uso recusado preserva estoque e turno. Curas também podem ser usadas na loja; curativos e bônus são usados no menu Itens da batalha. Poções básicas continuam a 5 ouro e descanso a 20.

Categorias e potências usam como referência as [poções oficiais de Diablo II](https://classic.battle.net/diablo2exp/items/potions.shtml). Os preços são próprios do Drakoria, ajustados à economia existente. A estrutura regional tem como referência os [eventos de Guild Wars 2](https://www.guildwars2.com/en/the-game/dynamic-events/).

Demo e backend compartilham catálogo, validação de estoque e efeitos. O backend recebe o inventário local no setup e desconta itens aceitos por batalha; não há conta ou inventário persistente autenticado no servidor. Missões e compras usam o save local existente. Os testes `potionShop.test.ts` e `regionalQuests.test.ts` cobrem compras, efeitos, duração, recusas, paridade, aceitação, progressão, entregas e duplicações.

### Ferreiro e equipamentos temáticos dos monstros

O ferreiro cria equipamentos em vez de vendê-los. Os 27 modelos dos conjuntos Leão Rubro, Constelação Arcana e Falcão Verde são usados em 108 receitas de forja, com as imagens existentes. Equipamentos comprados anteriormente são preservados e continuam canônicos.

| Resultado da forja | Nível | Peça consumida, no mesmo slot/classe | Fragmentos | Ouro |
| --- | ---: | --- | ---: | ---: |
| Raro | 10 | Comum ou incomum até Nv.10 | 10 | 60 |
| Épico | 25 | Raro até Nv.25 | 30 | 250 |
| Lendário | 40 | Épico até Nv.40 | 80 | 700 |
| Mítico | 55 | Lendário até Nv.55 | 180 | 1800 |

A forja exige o nível do resultado e nunca falha. Na aba **Desmontar**, uma unidade sobressalente vira fragmentos: comum 2, incomum 3, raro 6, épico 12, lendário 24 ou mítico 48, mais 1 a cada 10 níveis do item. Isso reaproveita drops existentes sem alterar suas chances ou adicionar materiais ao estoque das poções. Fragmentos ficam no depósito da forja, sem ocupar slots da mochila.

Antes de confirmar, a interface mostra custos e atributos da peça utilizada e do resultado. Desmontagem também pede revisão da unidade consumida. Equipados ficam protegidos; uma cópia extra pode ser usada sem remover a equipada. A peça criada vai para a mochila, e falta de espaço ou recursos não consome nada. Receitas respeitam a classe; armas são adaptadas para Berserk e Assassino, e escudos não aparecem para Berserk. Os míticos recebem +5 no atributo principal da classe e o brilho já existente. Os itens criados têm atributos canônicos compartilhados pela demo e pelo backend; a persistência continua no save local existente.

`tests/crafting.test.ts` cobre receitas, progressão, materiais, custos, recusas, itens equipados, cópias extras, mochila cheia, sets antigos e compatibilidade com subclasses/backend.

Os 16 equipamentos de `img/itens/loot_monstros` foram registrados no catálogo compartilhado e no servidor. Cada monstro correspondente tem uma rolagem temática adicional, independente do equipamento genérico e dos livros. Chances por abate seguem a proposta: Goblin/Rato/Hobgoblin 3%; Esqueleto/Orc/Aranha/Espectro/Lobo Sombrio 2%; Árvore 1%; Hobgoblin Elite 6%; Senhor da Guerra 8%; Hidra/Coveiro/Lobo Mutante 3%; Rei Orc tem rolagens separadas de 3% para machado e 2% para medalhão.

O nível e os atributos da peça temática acompanham o nível do monstro (1–55), corrigindo requisitos propostos que impediam drops nas regiões atuais. Após ocorrer o drop, a raridade usa estas chances condicionais:

| Origem | Comum | Raro | Épico | Lendário | Mítico |
| --- | ---: | ---: | ---: | ---: | ---: |
| Comum | 70% | 22% | 6% | 1,8% | 0,2% |
| Elite | 35% | 45% | 17% | 2,5% | 0,5% |
| Boss | 15% | 45% | 30% | 9% | 1% |

Míticos recebem +5 extras de ataque físico, poder mágico nas peças de Mago ou defesa física em acessórios universais, já incluídos nos stats. Descrições explicam o bônus. A mochila e os equipamentos exibem os ícones; raridades têm cores discretas e míticos recebem fundo levemente vermelho e partículas suaves. A animação respeita a preferência de movimento reduzido. Faca exige Assassino, machado do Rei exige Berserk e duas mãos. O servidor reconstrói atributos dos IDs registrados, incluindo variantes de subclasse.

`artEquipment.test.ts` cobre catálogo, imagens, associação de drops, raridades, bônus, validação canônica, subclasses e compras; a suíte completa inclui os drops genéricos e as regras de inventário anteriores.

### Painel e resumo da expedição

Na batalha, o painel compacto mostra a região e as vitórias até o boss. Abra-o para consultar profundidade, XP e ouro acumulados e a missão acompanhada. Os níveis, encontros, drops e pontos de aparecimento dos bosses continuam os mesmos.

Ao liberar o boss, a tela de vitória pausa a exploração: **Enfrentar o boss** inicia o confronto, **Voltar ao mapa** encerra a expedição, e **Retornar à cidade** leva à praça. Em **Preparação**, todas as nove poções de recuperação podem ser usadas a partir do estoque real da mochila; curativos e bônus continuam exclusivos do combate. Recursos são preservados ao prosseguir. As opções de saída permanecem na barra inferior da preparação.

O resumo acumulado inclui XP, ouro, equipamentos (com raridade/nível) e livros obtidos em combate. Ele não entrega recompensas novamente e rejeita o mesmo identificador de batalha. A entrega de missões da Guilda não entra nesse total. Ao retornar ou sofrer derrota, o último resumo fica disponível no mapa; valores exibidos são ganhos brutos, com penalidades de derrota aplicadas separadamente pelas regras atuais. Uma nova exploração inicia uma contagem nova, mantendo o último recibo até a próxima saída.

No mapa, cada região informa níveis, boss, vitórias necessárias, missões ativas e entregas pendentes, além de um atalho para a Guilda. Saves de expedições anteriores continuam válidos; recompensas acumuladas começam a ser registradas após esta atualização, sem tentar reconstruir drops antigos.

`tests/expedition.test.ts` cobre as cinco regiões, totais e agrupamento de loot, duplicações, preparação de boss, preservação de recursos, arquivamento, derrota, novas expedições e saves antigos. `tests/victoryNavigation.test.ts` também valida a preparação, consumo de poção e exclusividade das ações de saída/continuação. Demo e backend usam o mesmo registro no cliente e as regras compartilhadas de dungeon.

### Conjuntos da forja

Equipe arma, armadura, pernas, botas, luvas, brinco, colar e anel forjados da mesma classe (8 peças; escudo opcional). Drops e itens da antiga loja não contam. Armas convertidas de Berserk/Assassino contam. A menor raridade define a regeneração do HP máximo: raro 3%, épico 4%, lendário 5%, mítico 6%.

- Bastião da Forja (Guerreiro): +8% ataque e +10% defesa.
- Chama Arcana (Mago): +12% poder mágico e recuperação de 5% da mana máxima por ação.
- Vento da Forja (Arqueiro): +10% velocidade, +5 pontos de crítico, +3 pontos de esquiva (limite de 50%).

Regeneração ocorre uma vez ao concluir uma ação válida do jogador, inclusive defender. Não ocorre durante ATB, ações recusadas ou turnos inimigos; não revive mortos por dano contínuo. Respeita os limites de HP/mana. Status e mochila mostram progresso e efeito do conjunto; a forja mostra as regras. Demo e backend usam a mesma implementação.

### Imagens dos equipamentos e cobertura de drops

As 59 artes em `img/itens/loot_monstros/icones_128` são registradas pela interface e empacotadas pelo Vite, incluindo a demo GitHub Pages. Os catálogos compartilhados apontam para essa pasta, usada também pelo backend.

- Drops genéricos: todos os nove slots de Guerreiro, Mago e Arqueiro, em todos os níveis/raridades já disponíveis, reutilizam a arte correspondente da classe (27 silhuetas). A arte não concede bônus de conjunto; apenas IDs forjados contam.
- Drops temáticos: os 16 modelos de Goblin, Esqueleto, Rato, Orc, Hobgoblin, Elite, Senhor da Guerra, Rei Orc, Aranha, Espectro, Lobo Sombrio, Árvore, Hidra, Coveiro e Lobo Mutante mantêm suas imagens próprias e variantes de raridade/nível.
- Drops legados: os 13 equipamentos de Goblin, Orc e mini-boss possuem artes específicas. O Olho da Verdade também usa sua imagem própria.
- Berserk usa imagem de machado; Assassino usa imagem de adagas. Armas temáticas que já eram machados/adagas preservam a arte original. Conversão mantém IDs, atributos e regras de uso.
- As duas artes de eventos (Natal/Páscoa) também estão registradas; isso não habilita novos eventos nem novos drops.

Saves conhecidos são reconstruídos pelo catálogo canônico e recebem as imagens atuais. O renderizador também aceita os caminhos antigos das pastas `equipamentos` e `complementares`. Não foi necessário renomear arquivos ou IDs. Nomes, chances, atributos e requisitos de drop permanecem iguais. `tests/dropEquipmentArt.test.ts` audita a existência e o registro de imagens de todas as variantes dos catálogos, incluindo armas de subclasses.
