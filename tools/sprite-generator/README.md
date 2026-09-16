# Drakoria Sprite Generator

Ferramenta para gerar GIFs de animacao a partir de spritesheets padronizados.

## Formato esperado do spritesheet

O spritesheet deve ter 6 linhas:

1. padrao / idle
2. ataque
3. defesa
4. magia
5. dano
6. morte

Cada linha deve ter a mesma quantidade de frames.

## Exemplo

```bash
node sprite-generator.js ^
  --input ../../raw-sprites/goblin.png ^
  --output ../../img/monstros ^
  --name goblin ^
  --frame-width 128 ^
  --frame-height 128 ^
  --frames 6 ^
  --delay 100
```
