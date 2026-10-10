# Mapa e expedições online

Entre em `/login`, crie seu personagem e use **Jogar online** (`/play`). A tela
fica na origem do backend para usar a sessão HttpOnly existente. Nada do save
local é enviado ou importado; a demo do GitHub Pages continua separada.

## Comportamento

- Guerreiro, Mago e Arqueiro usam nome, classe, nível, XP, ouro, equipamentos e
  recursos do PostgreSQL. O nome Taichou não concede privilégios.
- As cinco regiões de `WORLD_REGIONS` usam as configurações existentes:
  Cemitério (1–10, chefe 15), Pântano (10–20, chefe 25), Floresta (15–30,
  chefe 35), Acampamento Orc (25–35, chefe 40) e Fortaleza (35–50, chefe 55).
  As faixas são níveis dos monstros, não bloqueios de acesso. O mapa original
  permite explorar qualquer região povoada com HP positivo; essa regra continua.
- O servidor usa `pickDungeonRunEncounter`: profundidade aumenta os níveis,
  preserva os dois encontros iniciais da Fortaleza e a chance de Hobgoblin Elite.
  Após cinco vitórias, o próximo encontro é o chefe da região. É possível
  descansar/equipar antes dele. Sua derrota encerra a expedição; vencer o chefe
  conclui a expedição. Encerrar entre batalhas permite escolher outra região.
- Missões de Guilda, poções, livros/subclasses, forja, comércio e Pix ainda
  aguardam suas etapas de integração ao banco; seus sistemas locais continuam.
- Combate online por turnos. As regras compartilhadas de ATB determinam a
  ordem; o servidor avança turnos inimigos até a próxima ação do herói. O
  relógio do navegador não participa. Esta tela não é o combate em tempo real
  da demo. A velocidade influencia a ordem/frequência de ações.
- O navegador envia somente ataque, defesa, magia ou ID de habilidade.
  Classe, nível, mana e cooldown são validados pelo motor no servidor.
- HP e mana persistem. Descanso gratuito no acampamento recupera ambos,
  inclusive após derrota. Descanso e troca de equipamentos exigem batalha
  encerrada e versão atual do personagem. Derrota não entrega recompensas nem
  aplica perda de ouro nesta etapa de testes.
- Vitória salva XP, ouro, subida de nível, cada cópia de equipamento e seu
  registro de concessão em uma única transação. Não há endpoint de grant ou
  envio de resultado/recompensa pelo navegador.

## Interface visual

A interface reutiliza `arredores_de_drakoria.png`, as posições das cinco regiões,
os cenários e sprites de todos os seus monstros/chefes, as três classes e os
ícones de equipamentos. Os limites visíveis dos sprites usam as medidas do
renderizador original. Os arquivos são servidos na própria
origem em `/game-assets/` por uma lista exata de arquivos públicos; caminhos
arbitrários, travessia de diretórios e URLs externas não são aceitos. Assets
recebem MIME explícito, nosniff, cache de um dia e CORP same-origin. CSP da
página permite imagens somente da origem.

HP, mana, XP, equipamentos e resultado continuam vindos do snapshot do
servidor. Após uma ação aceita, a tela mostra ataque/defesa e as perdas líquidas
de HP naquele turno. Os efeitos são uma apresentação resumida do turno, não
um registro individual de cada golpe; o histórico textual permanece disponível.
Recarregar ou retomar a mesma revisão não reproduz ações nem entrega bens.

A arena adapta controles e tamanho dos personagens em telas pequenas. A opção
Reduzir movimento usa PNGs estáticos, desativa os efeitos e respeita a
preferência do sistema por movimento reduzido. Falhas em imagens ocultam a arte
sem remover as barras, nomes ou comandos. A conta atualmente não guarda gênero
ou aparência; esta etapa usa os sprites base masculinos de cada classe.

## Concorrência e recuperação

Migration 003 adiciona recursos, slot equipado e `online_battles`. O registro de
batalha contém o estado calculado no servidor, revisão, últimas 30 mensagens e
marcador de liquidação. As recompensas planejadas não aparecem na resposta
até uma vitória já liquidada. Cada item usa operação `battle:UUID:drop:index`.

Migration 004 adiciona `online_expeditions`, com região, profundidade, vitórias,
chefe pendente/derrotado, resumo recebido e status. Um índice permite somente
uma expedição ativa por personagem; a FK composta liga a batalha à expedição
da mesma conta. Vitórias e recompensas atualizam batalha, personagem e
expedição na mesma transação. O resumo é informativo, não tem resgate adicional.
Batalhas antigas de goblin continuam salvas e podem ser concluídas, sem crédito
na nova expedição. Nenhum personagem, mapa ou definição existente é removido.

Todas as leituras e comandos usam transação com lock do personagem da conta.
Um índice parcial permite só uma batalha ativa e outro só um equipamento por
slot. Inícios concorrentes retomam a batalha ativa; novos encontros exigem versão
atual, região válida e ID da expedição ativa quando houver; `requestId` permite repetir
um início sem criar outro encontro. Ações exigem UUID da batalha pertencente à
conta e revisão atual. Duas abas/reenvios aceitam só uma ação por revisão; as
outras recebem 409. Descanso/equipar exigem versão atual; posse, classe e nível
são consultados no servidor.

Fechar a página, trocar de dispositivo ou reiniciar o processo mantém a batalha
pausada no turno salvo. Na próxima entrada `/game/state` recupera personagem,
inventário e encontro. Não há timer ou combate em memória no fluxo online.
O cliente tenta recuperar o estado após resposta interrompida/conflito e
oferece atualização manual. Não há sincronização automática entre abas.

Os sockets antigos de produção continuam bloqueados, porque aceitam setup do
navegador. Este fluxo usa HTTP autenticado, JSON de até 16 KiB, POST com Origin
exata, campos conhecidos, CSP, no-store e textContent. Há até quatro operações
simultâneas por processo e 120 solicitações/minuto por conta no PostgreSQL.
Antes de produção/comércio, evoluir limites globais/IP, políticas operacionais,
retenção de batalhas e paginação de inventário. O staging usa banco Free com
expiração; não deve guardar bens com valor financeiro.

## API

| Método | Rota | Entrada |
| --- | --- | --- |
| GET | /game/state | Nenhuma; conta vem da sessão |
| POST | /game/start | requestId UUID, regionId, version string, expeditionId UUID somente para continuar |
| POST | /game/action | battleId UUID, revision inteiro, action {type[, skillId]} |
| POST | /game/retreat | version string, expeditionId UUID |
| POST | /game/rest | version string |
| POST | /game/equip | version string, instanceId UUID |

## Validação

`tests/onlineGame.test.ts` cobre forma de comandos, avanço de turnos e recusa
de habilidades/equipamentos incompatíveis. `server/tests/onlineGame.test.ts`
usa schema isolado em PostgreSQL real para isolamento de contas, inícios e
ações concorrentes, liquidação única, persistência com nova instância do
repositório, descanso/equipamento, rollback de falha de auditoria, sessão
revogada e bloqueio de atributos/accountId adulterados via HTTP.

Os testes também cobrem os cinco catálogos completos, a preparação/conclusão
do chefe, o retorno ao mapa, acesso por nível e rollback do progresso da expedição.
O CI Chromium verifica o mapa, escolha de região, artes regionais, chefes,
movimento reduzido e telas desktop/mobile sob a CSP real.

Teste manual após deploy: Google → personagem → Jogar online → concluir
batalha → atualizar/fechar/entrar novamente → verificar XP/ouro/inventário.
Teste duas abas na mesma batalha: a ação obsoleta deve pedir atualização sem
entregar outra recompensa. Nunca execute `test:db` contra staging/produção.
