# Drakoria Sprite Generator

Ferramenta para gerar GIFs de animacao a partir de spritesheets padronizados.

## Instalação

Use Node.js 20 e npm. A ferramenta tem seu próprio `package.json` e
`package-lock.json`; a instalação da raiz do jogo não instala suas dependências.

Na raiz do repositório:

```bash
cd tools/sprite-generator
npm ci
node sprite-generator.js --help
```

O código e o lockfile são versionados. `node_modules/` e `dist/` são locais e
ignorados pelo Git; reinstale as dependências com `npm ci` após clonar.

## Formato esperado do spritesheet

O spritesheet deve ter 6 linhas:

1. padrao / idle
2. ataque
3. defesa
4. magia
5. dano
6. morte

Cada linha deve ter a mesma quantidade de frames.

## Exemplo com configuração JSON

Dentro de `tools/sprite-generator`, crie um arquivo `sprite-config.json`:

```json
{
  "input": "../../raw-sprites/goblin.png",
  "output": "../../img/monstros",
  "name": "goblin",
  "frameWidth": 128,
  "frameHeight": 128,
  "actions": [
    { "key": "padrao", "row": 0, "frames": 6, "delay": 100 },
    { "key": "ataque", "row": 1, "frames": 6, "delay": 100 },
    { "key": "defesa", "row": 2, "frames": 6, "delay": 100 },
    { "key": "magia", "row": 3, "frames": 6, "delay": 100 },
    { "key": "dano", "row": 4, "frames": 6, "delay": 100 },
    { "key": "morte", "row": 5, "frames": 6, "delay": 100 }
  ]
}
```

Forneça um spritesheet PNG de 768 × 768 pixels no caminho de `input`, ou ajuste
o caminho e as dimensões para sua imagem. Esse PNG de exemplo deve ser fornecido
por você. Os caminhos de entrada e saída são relativos ao arquivo JSON.

```bash
node sprite-generator.js --config sprite-config.json
```

A saída contém seis GIFs (`goblin.gif`, `goblin-ataque.gif`, etc.) e
`goblin.manifest.json`. Confira os GIFs antes de substituir artes do jogo.
As imagens usadas pelo jogo em `img/` continuam versionadas.

## Executável Windows (opcional)

O comando de empacotamento existente é:

```bash
npm run build:exe
```

Ele usa `pkg` para o alvo `node18-win-x64`, pode baixar o runtime de
empacotamento e grava `dist/drakoria-sprite-generator.exe`. O executável não é
necessário para gerar GIFs com Node.js e não deve ser adicionado ao Git. O fluxo
de geração documentado acima usa Node.js diretamente; o empacotamento Windows
não faz parte das verificações de CI do jogo.
