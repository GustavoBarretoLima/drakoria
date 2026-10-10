const el = id => document.getElementById(id);
let mode = 'login';
let busy = false;
function message(text) { el('message').textContent = text; }
async function api(path, body) {
  const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store',
    ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
  const data = await response.json();
  if (!response.ok) { const error = new Error(data.error || 'Não foi possível concluir.'); error.status = response.status; throw error; }
  return data;
}
async function run(work) {
  if (busy) return;
  busy = true; document.querySelectorAll('button').forEach(button => { button.disabled = true; });
  message('Aguarde…');
  try { await work(); } catch (error) { message(error instanceof Error ? error.message : 'Tente novamente.'); }
  finally { busy = false; document.querySelectorAll('button').forEach(button => { button.disabled = false; }); }
}
async function refresh() {
  try {
    const { account, character } = await api('/auth/session');
    el('auth').hidden = true; el('account').hidden = false;
    el('account-email').textContent = account.email;
    el('character-summary').textContent = character ? `${character.name} · ${character.hero_class} · Nível ${character.level}` : 'Crie seu primeiro personagem.';
    el('create-character').hidden = !!character;
    message('Você está conectado.');
  } catch (error) {
    if (error.status !== 401) throw error;
    el('account').hidden = true; el('auth').hidden = false; message('');
  }
}
function choose(next) {
  mode = next;
  el('login-mode').setAttribute('aria-pressed', String(mode === 'login'));
  el('register-mode').setAttribute('aria-pressed', String(mode === 'register'));
  el('password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  el('submit').textContent = mode === 'login' ? 'Entrar' : 'Criar conta'; message('');
}
el('login-mode').addEventListener('click', () => choose('login'));
el('register-mode').addEventListener('click', () => choose('register'));
el('credentials').addEventListener('submit', event => {
  event.preventDefault();
  void run(async () => { await api(`/auth/${mode}`, { email: el('email').value, password: el('password').value }); el('password').value = ''; await refresh(); });
});
el('create-character').addEventListener('submit', event => {
  event.preventDefault();
  void run(async () => { await api('/auth/character', { name: el('character-name').value, heroClass: el('hero-class').value }); await refresh(); });
});
el('logout').addEventListener('click', () => { void run(async () => { await api('/auth/logout', {}); await refresh(); message('Você saiu da conta.'); }); });
async function setupGoogle() {
  const { googleClientId } = await api('/auth/config');
  if (!googleClientId) { el('google-message').textContent = 'Entrar com Google estará disponível em breve. Você já pode usar email e senha.'; return; }
  const { nonce } = await api('/auth/google-challenge', {});
  const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
  await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = () => reject(new Error('Não foi possível carregar o Google. Use email e senha.')); document.head.append(script); });
  google.accounts.id.initialize({ client_id: googleClientId, nonce, auto_select: false,
    callback: response => { void run(async () => { await api('/auth/google', { credential: response.credential }); await refresh(); }); } });
  google.accounts.id.renderButton(el('google-button'), { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', locale: 'pt-BR' });
  el('google-message').textContent = 'Use sua conta Google. Se o login expirar, recarregue esta página.';
}
void refresh().then(setupGoogle).catch(error => message(error.message));
