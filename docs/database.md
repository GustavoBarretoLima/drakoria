# Base PostgreSQL

Esta etapa adiciona infraestrutura de persistência. O jogo e a demo ainda não
usam essas tabelas: login real, sessão Socket.IO, saves online e entrega das
recompensas serão conectados em PRs seguintes. Não há importação de localStorage.

## Desenvolvimento local

Requisitos: Node.js 20, npm e Docker com Compose (ou PostgreSQL 18 existente).
Na raiz, copie `.env.example` para `.env`; configure a mesma senha local em
`POSTGRES_PASSWORD` e `DATABASE_URL`. No Windows, use `Copy-Item .env.example .env`.

```bash
npm ci
docker compose up -d --wait database
npm run db:migrate
```

O Compose publica o banco somente em `127.0.0.1:5432`, com volume persistente.
`docker compose down` encerra o serviço mantendo o volume. A conta criada pelo
Compose é administrativa e serve ao desenvolvimento; não é o usuário da
aplicação em produção. Não apague o volume para atualizar uma base existente.

As migrations são explícitas: o servidor não modifica o schema ao iniciar.
O comando usa `.env`, nunca variáveis `VITE_*`, e não imprime credenciais.
`DATABASE_SSL=disable` é para o banco local. Em produção, use `NODE_ENV=production`
e `DATABASE_SSL=verify-full`; se o provedor exigir uma CA própria, configure
`DATABASE_SSL_CA_FILE`. Parâmetros de SSL na URL são recusados para não
sobrescrever a verificação do certificado. Separe o usuário de migrations do
usuário runtime com permissões mínimas; mantenha a rede do banco restrita ao backend.

## Tabelas e uso interno

| Tabela | Responsabilidade |
| --- | --- |
| `accounts` | UUID estável, email normalizado e único, hash de senha, status |
| `account_sessions` | Hash binário de 32 bytes do token, expiração e revogação |
| `characters` | Um personagem por conta, classe, nível, XP, ouro do jogo e versão |
| `equipment_instances` | Uma linha/UUID por cópia; dono atual, personagem de origem e chave da concessão |
| `equipment_events` | Registro de concessão por cópia; UPDATE/DELETE bloqueados por trigger |
| `schema_migrations` | Nome, checksum e data das migrations aplicadas |

`password_hash` deve ser produzido por um serviço de autenticação. O tamanho
exigido na tabela não valida o algoritmo nem transforma senhas em hashes.
Da mesma forma, a tabela de sessões não implementa emissão ou verificação de
tokens. Não há endpoint público de criação de conta ou concessão de itens.

`CharacterRepository` contém APIs internas:

- `createAccountCharacter`: cria conta e personagem na mesma transação.
- `getCharacterForAccount`: consulta pelo ID de conta fornecido pelo serviço
  autenticado, sem retornar o hash da senha.
- `grantEquipment`: verifica que o personagem pertence à conta, resolve o item
  no catálogo do servidor e bloqueia a linha do personagem enquanto concede a
  cópia e registra o evento. Repetir a mesma chave com o mesmo item retorna o
  mesmo UUID; repetir com outro item é recusado. A chave identifica uma cópia,
  por exemplo `battle:<id>:drop:<indice>:copy:<indice>`.

Os argumentos de conta dessas APIs devem vir da sessão verificada, nunca de
um ID enviado pelo jogador. Hoje não são conectadas aos handlers Socket.IO.
Ouro e XP usam bigint com limite numérico compatível com o jogo; o driver retorna
esses campos como strings, sem conversão global que perca precisão.

As operações usam queries parametrizadas e uma conexão por transação. Migrations
concorrentes são serializadas por advisory lock; alterações em arquivos já
aplicados são recusadas. Adicione novas migrations para evoluir o schema.

## Testes

`npm test` executa a suíte do jogo e configuração de conexão. `npm run test:db`
exige `TEST_DATABASE_URL` apontando para uma base de testes separada, onde a conta
tem permissão de criar schemas. A suíte cria e remove apenas seu schema aleatório;
não deve ser executada na produção. Não há fallback ou skip sem PostgreSQL.

A CI inicia PostgreSQL 18 e executa `test:db` antes de build/publicação. A suíte
valida migrations concorrentes/idempotentes, unicidade de contas, isolamento por
conta, constraints, rollback, concessões concorrentes sem duplicação, recusa de
alterações de eventos e rollback se o registro da concessão falhar.

## Preparação para vendas com Pix

Ouro do jogo não representa reais. Ainda não há saldo em reais, anúncio, compra,
transferência de propriedade, cobrança Pix ou saque. IDs de cópia, origem imutável
na API e concessões idempotentes são uma base para evoluir esses recursos; não
constituem um marketplace financeiro completo. Triggers não impedem adulteração
por um administrador do banco e não substituem backups e auditoria operacional.

Antes de ativar negociações com dinheiro, implemente conta autenticada, save
autoritativo, controle de posse/equipamento e transferências transacionais.
Defina então o provedor e o fluxo de pagamento (incluindo split, taxas e
responsabilidades). Essa etapa deve incluir valores em centavos, pedidos com
estado explícito, confirmação de pagamento pelo provedor, webhooks autenticados
e idempotentes, conciliação e tratamento de cancelamentos/estornos. A liberação
do item deve depender da confirmação validada no servidor, não do navegador.

Referências técnicas:
- https://node-postgres.com/features/transactions
- https://node-postgres.com/features/ssl
- https://www.postgresql.org/docs/current/ddl-constraints.html
- https://github.com/docker-library/docs/blob/master/postgres/README.md
