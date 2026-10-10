# Render staging

O `render.yaml` configura somente o backend de testes; a demo publicada continua
com seu comportamento atual. O portal `/login` oferece cadastro, login e
criação de personagem no banco. Saves de combate online e pagamentos Pix ainda
não estão conectados.

## Recursos

- Workspace: Gustavo Barreto's Workspace (`tea-cspp9al6l47c73cu3odg`).
- Banco existente: `drakoria-staging-db`, PostgreSQL 18, Virginia, plano Free.
- Serviço: `drakoria-staging-api`, Node.js 20, Virginia, plano Free.
- O banco gratuito criado em 10/10/2026 expira em 09/11/2026. Não é uma base
  para produção ou transações financeiras. O serviço gratuito pode hibernar.

O Blueprint referencia o banco existente com `fromDatabase`; não declara outro
banco. A URL interna é injetada pelo Render, sem credenciais no repositório ou
no navegador. A lista de IPs externos do banco está vazia.
`DATABASE_SSL=render-internal` só é aceito na plataforma Render com hostname
privado curto `dpg-…-a`. Conexões externas continuam exigindo TLS verificado.

## Aplicação do Blueprint

Após o merge de `render.yaml` na main, abra:
https://dashboard.render.com/blueprint/new?repo=https://github.com/GustavoBarretoLima/drakoria

Escolha o workspace acima, branch `main` e arquivo `render.yaml`. A prévia deve
criar apenas o serviço web Free e referenciar o banco existente. Clique em
Deploy Blueprint. Se o GitHub não estiver autorizado no Render, conecte a conta
pelo próprio painel. Não copie a URL ou a senha do banco para o chat.

Build: `npm ci --include=dev && npm run typecheck`.
Start: `npm run server:deploy`. As migrations terminam antes de o servidor abrir
a porta; falhas impedem a inicialização. O runner usa advisory lock e checksum
para serializar deploys concorrentes e evitar mudanças em migrations aplicadas.
A mesma credencial administrativa é usada em staging. Antes de produção, separe
o usuário de migrations do usuário runtime com permissões mínimas.

O servidor usa `PORT`, escuta `0.0.0.0`, restringe origens com
`ALLOWED_ORIGINS` e encerra conexões/loops ao receber SIGTERM. A origem padrão
no Blueprint é `https://gustavobarretolima.github.io`. Essa restrição não
substitui autenticação de jogadores.

## Verificação

Acompanhe o primeiro deploy no Render: migrations concluídas, servidor iniciado
e estado Live. `GET /healthz` deve responder 200 com `{"status":"ok"}` e
verifica acesso ao banco. Falhas retornam 503 sem detalhes de conexão. Não
execute a suíte `test:db` neste banco; ela pertence ao ambiente isolado da CI.

Acesse `/login` no backend para testar a conta. Configure `GOOGLE_CLIENT_ID`
para ativar Google, conforme [Autenticação](authentication.md). A próxima etapa
é persistência autoritativa de combate antes de ligar o cliente online.
