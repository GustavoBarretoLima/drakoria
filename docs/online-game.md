# Primeira região online

Entre em `/login`, crie seu personagem e use **Jogar online** (`/play`). A tela
fica na origem do backend para usar a sessão HttpOnly existente. Nada do save
local é enviado ou importado; a demo do GitHub Pages continua separada.

## Comportamento

- Guerreiro, Mago e Arqueiro usam nome, classe, nível, XP, ouro, equipamentos e
  recursos do PostgreSQL. O nome Taichou não concede privilégios.
- Primeira região: goblins normais no nível do personagem, limitado a 10.
  O servidor escolhe o encontro; bosses, outras regiões, missões, poções,
  livros/subclasses, forja, comércio e Pix não estão habilitados aqui.
- Combate online por turnos. As regras compartilhadas de ATB determinam a
  ordem; o servidor avança turnos inimigos até a próxima ação do herói. O
  relógio do navegador não participa. Esta tela não é o combate em tempo real
  da demo. A velocidade influencia a ordem/frequência de ações.
- O navegador envia somente ataque, defesa, magia ou ID de habilidade.
  Classe, nível, mana e cooldown são validados pelo motor no servidor.
- HP e mana persistem. Descanso gratuito no acampamento recupera ambos,
  inclusive após derrota. Descanso e troca de equipamentos exigem batalha
  encerrada e versão atual do personagem. Derrota não entrega recompensas nem
  aplica perda de ouro nesta primeira região.
- Vitória salva XP, ouro, subida de nível, cada cópia de equipamento e seu
  registro de concessão em uma única transação. Não há endpoint de grant ou
  envio de resultado/recompensa pelo navegador.

## Interface visual

A arena reutiliza `floresta_sombria.png`, sprites das três classes e do goblin,
e ícones de equipamentos do repositório. Os arquivos são servidos na própria
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

Todas as leituras e comandos usam transação com lock do personagem da conta.
Um índice parcial permite só uma batalha ativa e outro só um equipamento por
slot. Inícios concorrentes retomam a batalha ativa; `requestId` permite repetir
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
| POST | /game/start | requestId UUID |
| POST | /game/action | battleId UUID, revision inteiro, action {type[, skillId]} |
| POST | /game/rest | version string |
| POST | /game/equip | version string, instanceId UUID |

## Validação

`tests/onlineGame.test.ts` cobre forma de comandos, avanço de turnos e recusa
de habilidades/equipamentos incompatíveis. `server/tests/onlineGame.test.ts`
usa schema isolado em PostgreSQL real para isolamento de contas, inícios e
ações concorrentes, liquidação única, persistência com nova instância do
repositório, descanso/equipamento, rollback de falha de auditoria, sessão
revogada e bloqueio de atributos/accountId adulterados via HTTP.

Teste manual após deploy: Google → personagem → Jogar online → concluir
batalha → atualizar/fechar/entrar novamente → verificar XP/ouro/inventário.
Teste duas abas na mesma batalha: a ação obsoleta deve pedir atualização sem
entregar outra recompensa. Nunca execute `test:db` contra staging/produção.
