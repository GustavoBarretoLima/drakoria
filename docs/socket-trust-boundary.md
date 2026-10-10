# Fronteira de confiança do modo online

Revisão do fluxo atual de conexão, setup, combate e recompensas. A demo do
GitHub Pages continua local; esta revisão trata do backend Socket.IO.

## Fluxo observado

1. O portal `/login` no backend autentica email/senha ou Google e emite uma
   sessão HttpOnly. A demo tem entrada explícita sem conta; não simula login.
2. Sockets de produção estão bloqueados enquanto os handlers ainda recebem
   setup do navegador. O fluxo abaixo descreve desenvolvimento local. CORS e
   handshake restringem origens; isso não comprova identidade de jogador.
3. Ao conectar, `client/src/main.ts` envia `player:setup` com dados derivados
   do `localStorage`. A batalha é associada a `socket.id` em `BattleManager`.
4. O servidor calcula combate e recompensas com regras compartilhadas, mas
   `applyVictoryRewards` no cliente entrega XP, ouro, drops e livros ao save
   local. `progressionClient.ts` e `inventoryClient.ts` persistem no navegador.
5. Ao desconectar, o servidor remove a batalha e o timer. Não há recuperação
   persistente da batalha por conta após reconexão ou reinício do servidor.

## O que o servidor verifica e o que ainda confia ao cliente

| Entrada | Verificação atual | Informação ainda fornecida pelo cliente |
| --- | --- | --- |
| Classe, subclasse, nome | Classe conhecida, subclasse compatível e nome com tamanho limitado | Identidade e desbloqueio da subclasse |
| Nível | Inteiro entre 1 e 100; stats calculados pelo servidor | Nível conquistado e XP que o justifica |
| Equipamentos | Até nove IDs; itens reconstruídos do catálogo, restrições e um item por slot | Posse de cada item |
| HP e mana | Valores finitos não negativos; limitados aos máximos ao criar o combate | Recursos legítimos entre encontros |
| Talentos | Coleção limitada e ranks inteiros; normalização compartilhada aplica pré-requisitos, limites por nó e orçamento | Subclasse desbloqueada e alocação salva |
| Habilidades equipadas | Até quatro slots, incluindo slots vazios; normalização Berserk verifica aprendizado e duplicatas | Loadout salvo |
| Poções | IDs conhecidos e quantidades inteiras de 0 a 9999 | Estoque adquirido pelo jogador |
| Monstro | ID limitado e consulta ao catálogo na criação | Elegibilidade para a região, boss ou encontro |
| Ação e uso de item | Forma da ação, batalha do socket e regras de turno/custo/estoque | O socket não representa uma conta autenticada |
| Recompensa final | Resultado calculado pelo servidor | Aplicação e persistência no save local |

Campos extras no setup não são usados como stats. Validar forma, limites e
catálogos não comprova identidade, posse ou histórico do jogador.

## Correções deste PR

- Um `player:setup` válido não substitui uma batalha ainda em andamento no
  mesmo socket. A rejeição mantém o estado e o timer, sem repor poções ou HP.
  Uma batalha concluída permite iniciar o próximo encontro.
- Setup rejeita classes desconhecidas, subclasses incompatíveis, nível fora
  de 1–100, recursos negativos/extremos, nome acima de 160 caracteres,
  mais de quatro slots de habilidades e estoques inválidos.
- O tamanho máximo de `treeRanks` e o maior rank permitido na entrada são
  derivados dos catálogos atuais. A normalização posterior continua verificando
  cada talento, seus pré-requisitos e o orçamento. Chaves desconhecidas de
  tamanho válido nessa coleção são descartadas pela normalização.
- Slots vazios (`""`) de habilidades Berserk são aceitos, conforme o formato
  produzido pelo cliente.

O bloqueio de substituição vale para o socket atual. Reconectar cria outro
socket e permite um novo setup: identidade persistente e validação contra o
save do servidor continuam necessárias. Limites de coleções aqui são validação
de campos; não substituem limites de transporte ou controle de frequência.

## Próximas etapas para progresso persistente por conta

1. Reusar a autenticação e o PostgreSQL já implementados. Verificar a sessão
   no handshake e associar a conexão a um ID de conta estável.
2. Carregar o personagem pelo ID da conta no servidor. No modo online, o
   cliente deve solicitar um encontro, sem definir nível, posse de itens,
   estoque, recursos ou desbloqueios. Validar elegibilidade do encontro.
3. Aplicar recompensas e penalidades no servidor, em transação com o save.
   Registrar o ID da batalha concluída para impedir entregas duplicadas em
   reenvios/reconexões. Usar controle de versão para alterações concorrentes.
4. Persistir alterações de equipamentos, talentos, poções, compras e missões
   por comandos validados. Retornar ao cliente o snapshot resultante.
5. Definir retomada ou encerramento de batalhas em desconexões, política de
   sessões simultâneas e recuperação após reinício do backend.
6. Manter o save local da demo separado do progresso online. Uma eventual
   importação de saves locais precisa de política explícita; não pode conferir
   automaticamente bens ou nível em contas online.

Critérios de validação para essa etapa futura: conta A não altera o personagem
de B; setup adulterado não concede poder; recompensa é entregue uma única vez;
reconexão e reinício preservam o progresso; clientes concorrentes não duplicam
itens; demo continua funcionando sem backend.
