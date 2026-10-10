# Autenticação e portal de contas

O portal é servido em `/login` pelo próprio backend. O frontend do GitHub Pages
linka para ele e mantém uma entrada explícita para a demo sem conta. O cookie
fica no domínio do backend; não usa cookies de terceiros entre GitHub e Render.
Não há login fictício, token em localStorage, importação de save local ou Pix.

## Fluxos disponíveis

- Email/senha: cadastro e login, senha de 12 a 128 caracteres, scrypt assíncrono
  N=32768/r=8/p=3 com salt aleatório de 16 bytes e comparação em tempo constante.
- Google: Google Identity Services (GIS), verificação de assinatura, audience,
  issuer e expiração pela google-auth-library; email verificado, Gmail ou
  Workspace, nonce ligado a um desafio do navegador que expira em 5 minutos e
  é consumido uma única vez. A identidade é o `sub`, não o nome ou email.
- Sessão opaca de 256 bits, hash SHA-256 no banco, validade absoluta de 7 dias,
  rotação no novo login e revogação na saída. Contas bloqueadas não autenticam.
- Um personagem por conta, nome e classe validados e nível 1/XP 0/ouro 0 vindos
  do banco. Não aceita accountId, progresso ou equipamentos do cliente.

Contas Google não são vinculadas a contas de senha pelo email. Se o email já
existir, o usuário precisa entrar pelo método original. Um fluxo explícito de
vinculação autenticada ainda será implementado. Email/senha ainda não tem
confirmação de email nem recuperação de senha; o email fica não verificado.
Use dados de teste nesta fase. Não copie senhas ou tokens para logs/chat.

## Segurança HTTP

Em produção o cookie é `__Host-drakoria_session`, Secure, HttpOnly, SameSite=Lax,
Path=/ e sem Domain. POSTs exigem Origin exatamente igual a AUTH_PUBLIC_URL,
Content-Type JSON, corpo de até 16 KiB, campos conhecidos e limite de leitura.
Não há CORS para as rotas de conta. Todas as respostas usam no-store e CSP.
A tela renderiza dados de conta/personagem com textContent.

Limites no PostgreSQL: 60 mutações de conta por minuto no serviço e 8 tentativas
por email em 15 minutos. Até duas operações simultâneas por processo evitam
saturação dos hashes. Limites persistem entre reinícios. Sessões antigas,
desafios vencidos e contadores antigos são limpos a cada hora. Esse limite
agregado é adequado ao staging; antes de escalar, evoluir por IP/conta, proteção
contra abuso e controle operacional.

Sockets de produção ficam fechados até carregar estado do personagem e
persistir recompensas no servidor. Autenticação por si só não torna seguro
aceitar nível ou posse de equipamentos enviados pelo jogador. A demo permanece
local e não compartilha os bens com a conta online.

## Desenvolvimento

Configure o PostgreSQL e aplique migrations conforme database.md. Com `.env`:

```bash
npm run db:migrate
node --env-file=.env --import tsx server/src/index.ts
```

Abra http://localhost:3001/login. AUTH_PUBLIC_URL deve ser exatamente
http://localhost:3001. Se usar 127.0.0.1 ou outra porta, altere a origem também.
O comando server:deploy aplica migrations antes de iniciar no Render.

## Ativar Entrar com Google

1. No Google Cloud, crie/selecione um projeto e configure Google Auth Platform:
   Branding (nome e email de suporte), Audience (usuários externos; contas de
   teste se estiver em Testing) e Data Access com identidade básica.
2. Em Clients, crie um OAuth Client ID do tipo Web application.
3. Em Authorized JavaScript origins, adicione:
   https://drakoria-staging-api.onrender.com
   Para teste local, também http://localhost:3001. Não coloque /login na origem.
4. Copie apenas o Client ID público, terminado em .apps.googleusercontent.com,
   para GOOGLE_CLIENT_ID nas variáveis do serviço Render e faça redeploy.
   Esta integração GIS usa callback JavaScript; não precisa client secret nem
   Gmail API, acesso à caixa de email ou URI de redirecionamento.
5. Abra /login e teste o botão Google com a conta autorizada. Não coloque um
   Client ID de outro projeto: audience é verificada no servidor.

Sem GOOGLE_CLIENT_ID, email/senha funciona e a tela informa que Google ainda
não está disponível. `/auth/config` publica apenas o Client ID, nunca segredo.

## Endpoints

| Método | Rota | Uso |
| --- | --- | --- |
| GET | /auth/config | Disponibilidade e Client ID público |
| POST | /auth/register | Cadastro com email/password |
| POST | /auth/login | Login com email/password |
| GET | /auth/session | Conta autenticada e seu personagem |
| POST | /auth/logout | Revogar sessão atual |
| POST | /auth/google-challenge | Preparar nonce e cookie temporário |
| POST | /auth/google | Validar credential GIS e estabelecer sessão |
| POST | /auth/character | Criar personagem da sessão (name/heroClass) |

## Validação

A suíte unitária verifica hashing, cookies, CSRF, limites do corpo, nonce,
validação de claims Google e rejeição de ownership forjado. test:db usa schema
isolado com PostgreSQL 18 para testar migrações, sessões expiradas/revogadas,
contas bloqueadas, concorrência Google, recusa de vinculação por email,
concessão de personagem único, desafios de uso único e rate limits concorrentes.
Não execute test:db no banco de staging nem na produção. O login Google real
exige o Client ID e um teste pelo navegador após configurá-lo.

Referências:
- https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
- https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback
