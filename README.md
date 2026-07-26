🏰 Drakoria


Drakoria é um projeto de RPG interativo desenvolvido em HTML, CSS, TypeScript e Vite, com foco em narrativa, ambientação e efeitos visuais.
O jogador assume o papel de um herói que inicia sua jornada em um mundo devastado por guerras antigas.

⚙️ Estrutura do Projeto
Pasta	Descrição
audio	Arquivos de som e efeitos (ex: goblin-risada.mp3).
client/src	Código-fonte principal do jogo, incluindo assets, lógica de batalha, rede, páginas e interface.
css	Folhas de estilo separadas por contexto (batalha, login, inventário, etc.).
dist	Versão compilada pronta para produção, gerada pelo Vite.
shared	Arquivos de configuração e metadados do projeto (package.json, vite.config.js, tsconfig.json).


🧩 Tecnologias Utilizadas
TypeScript – lógica e tipagem segura.

Vite – build rápido e otimizado.

HTML5 / CSS3 – estrutura e estilo das páginas.

JavaScript – interatividade e animações.

Node.js – ambiente de execução para desenvolvimento e build.

🚀 Como Executar Localmente
bash
# Clone o repositório
git clone https://github.com/GustavoBarretoLima/drakoria.git

# Acesse a pasta
cd drakoria

# Instale as dependências
npm install

# Execute o projeto em modo de desenvolvimento
npm run dev
🏗️ Build para Produção
bash
npm run build
Os arquivos compilados serão gerados na pasta dist/.
Essa pasta deve ser publicada no GitHub Pages ou outro serviço de hospedagem.

🎮 Funcionalidades Principais
Introdução com efeito typewriter e botão de fade-in.

Sistema de personagens e classes armazenado em localStorage.

Áudio e efeitos visuais integrados.

Estrutura modular para futuras expansões (batalhas, inventário, mapa).

📦 Deploy no GitHub Pages
Gere o build (npm run build).

Configure o Pages para servir a pasta dist.

Acesse o jogo em:
👉 Drakoria no GitHub Pages (gustavobarretolima.github.io in Bing) (bing.com in Bing)

💡 Próximos Passos
Adicionar trilha sonora dinâmica.

Implementar sistema de status

Criar itens/equipamentos

Adicionar dungeons

Criar Banco de dados

🧙 Autor
Desenvolvido por Gustavo Barreto Lima  
📧 Contato: gustavobarretolima@gmail.com
