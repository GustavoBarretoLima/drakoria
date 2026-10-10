# Guilda online

Em `/play`, a Guilda usa as 15 missões de `regionalQuests.ts`, com as mesmas
recompensas e requisitos do jogo existente. Cada conta tem seu progresso
separado da demo local. A interface permite consultar contratos por região,
acompanhar objetivos na exploração e consultar a última entrega.

- Caça: cinco monstros comuns/elites da região dentro da faixa original.
- Coleta: três cópias de equipamentos obtidas em vitórias após aceitar a missão.
  Equipamentos anteriores e recompensas da Guilda não contam; itens ficam com o jogador.
- Chefe: o chefe e o nível exatos da configuração regional. Entregar concede
  XP, ouro, reputação e uma arma épica da classe no nível do chefe.
- Rank, reputação e próxima promoção são derivados das entregas persistidas,
  mantendo as condições de nível, rank e chefe anterior do catálogo.
- Contratos repetíveis zeram o objetivo ao aceitar novamente e preservam o
  número de entregas. Missões de chefe têm entrega única.

Aceitar e entregar exigem batalha encerrada e versão atual do personagem. Isso
impede aceitar durante um combate e contar seus drops retroativamente, ou
alterar o nível/equipamento enquanto o motor mantém os atributos da batalha.
Missões aceitas não se encerram com derrota, descanso ou retorno ao mapa.
Derrotas não avançam objetivos. Só novos resultados de vitória liquidados pelo
servidor contam; não há reconstrução a partir de inventário ou histórico antigo.

Migration 005 adiciona `online_guild_progress` e `online_quest_commands` sem
alterar personagens, batalhas ou expedições anteriores. O lock do personagem
serializa comandos. A liquidação `online_battles.settled` impede contar uma
vitória novamente, na mesma transação de XP, itens e progresso da expedição.
O vetor auxiliar `seenBattles` do motor compartilhado não é persistido como
um segundo histórico crescente; a batalha persistida é a fonte de deduplicação.

Entregas aplicam XP/ouro, objetivo entregue, reputação derivada, arma e evento
de concessão em uma transação. A chave única `(character_id, request_id)` permite
repetir uma resposta perdida sem nova entrega, inclusive após aceitar novamente
um contrato. Reutilizar a chave para outra missão/operação é recusado. As armas
usam a definição canônica e operação de auditoria `quest:UUID:gear`.
A última entrega é um recibo informativo, sem endpoint de resgate adicional.

POST `/game/quests/accept` e `/game/quests/claim` recebem somente `requestId`,
`questId` e `version`. Conta vem da sessão HttpOnly. Quantidade, objetivos,
recompensas, classe, rank e reputação nunca vêm do navegador. Os endpoints
mantêm validação de Origin, sessão ativa, limite de solicitações e campos exatos.

`server/tests/onlineGuild.test.ts` usa schema isolado em PostgreSQL real para
aceitação/entrega concorrentes, isolamento, gates, drops anteriores, contagem
de cópias, chefe exato, repetição, armas, auditoria, recuperação e rollback após
escritas da missão/personagem. Chromium verifica comandos, recibo, rank,
recarga sem replay e desktop/mobile. Nunca executar testes de banco em staging.

Teste manual: aceitar Patrulha/Coleta do Cemitério, vencer monstros, conferir
objetivos, entregar, atualizar e verificar XP/ouro/reputação. Para a campanha,
aceitar o chefe antes de enfrentá-lo e entregar sua missão para promover rank.
