import { SUBCLASS_SPRITE_FOLDERS } from "../../../shared/src/classes/subclassSprites.js";
import { SUBCLASS_DEFINITIONS, type SubclassId } from "../../../shared/src/classes/subclasses.js";
import type { MonsterSpriteSet } from "../../../shared/src/types/monster.js";

function assetPath(path: string): string {
  const normalizedPath = path.replace(/^\/+/, "");
  return `${(import.meta.env?.BASE_URL ?? "/")}${normalizedPath}`;
}

export const gifsHeroi = {
  guerreiro: {
    Masculino: {
      padrao: assetPath("img/personagens/heroi_anime/idle.gif"),
      atk: assetPath("img/personagens/heroi_anime/attack.gif"),
      defesa: assetPath("img/personagens/heroi_anime/idle.gif"),
      damage: assetPath("img/personagens/heroi_anime/damage.gif"),
      magia: assetPath("img/skills/Slash.gif"),
    },
    Feminino: {
      padrao: assetPath("img/personagens/guerreira_anime/idle.gif"),
      atk: assetPath("img/personagens/guerreira_anime/attack.gif"),
      defesa: assetPath("img/personagens/guerreira_anime/idle.gif"),
      damage: assetPath("img/personagens/guerreira_anime/damage.gif"),
      magia: assetPath("img/skills/Slash.gif"),
    },
  },
  mago: {
    Masculino: {
      padrao: assetPath("img/personagens/mago_anime/idle.gif"),
      atk: assetPath("img/personagens/mago_anime/attack.gif"),
      defesa: assetPath("img/personagens/mago_anime/idle.gif"),
      damage: assetPath("img/personagens/mago_anime/damage.gif"),
      magia: assetPath("img/skills/Orb.gif"),
    },
    Feminino: {
      padrao: assetPath("img/personagens/maga_anime/idle.gif"),
      atk: assetPath("img/personagens/maga_anime/attack.gif"),
      defesa: assetPath("img/personagens/maga_anime/idle.gif"),
      damage: assetPath("img/personagens/maga_anime/damage.gif"),
      magia: assetPath("img/skills/Orb.gif"),
    },
  },
  arqueiro: {
    Masculino: {
      padrao: assetPath("img/personagens/elfo_anime/idle.gif"),
      atk: assetPath("img/personagens/elfo_anime/attack.gif"),
      defesa: assetPath("img/personagens/elfo_anime/idle.gif"),
      damage: assetPath("img/personagens/elfo_anime/damage.gif"),
      magia: assetPath("img/skills/Flecha.gif"),
    },
    Feminino: {
      padrao: assetPath("img/personagens/elfa_anime/idle.gif"),
      atk: assetPath("img/personagens/elfa_anime/attack.gif"),
      defesa: assetPath("img/personagens/elfa_anime/idle.gif"),
      damage: assetPath("img/personagens/elfa_anime/damage.gif"),
      magia: assetPath("img/skills/Flecha.gif"),
    },
  },
} as const;

export const gifsGoblin = {
  padrao: assetPath("img/monstros/goblin.gif"),
  atk: assetPath("img/monstros/goblin-ataque.gif"),
  damage: assetPath("img/monstros/goblin-dano.gif"),
  morte: assetPath("img/monstros/goblin-dano.gif"),
};

export function setEnemyGifs(sprites?: MonsterSpriteSet): void {
  if (!sprites) return;

  gifsGoblin.padrao = assetPath(sprites.idle);
  gifsGoblin.atk = assetPath(sprites.attack);
  gifsGoblin.damage = assetPath(sprites.damage);
  gifsGoblin.morte = assetPath(sprites.death ?? sprites.damage);
}

export function getHeroGifs(className: keyof typeof gifsHeroi, gender: "Masculino" | "Feminino", subclassId?: string) {
  const base = gifsHeroi[className][gender];
  const id = subclassId as SubclassId;
  if (!SUBCLASS_DEFINITIONS[id] || SUBCLASS_DEFINITIONS[id].baseClass !== className) return { ...base, morte: base.damage };
  const folder = SUBCLASS_SPRITE_FOLDERS[id][gender === "Feminino" ? "feminino" : "masculino"];
  const root = `img/personagens/${folder}`;
  return { ...base, padrao: assetPath(`${root}/idle.gif`), defesa: assetPath(`${root}/idle.gif`),
    atk: assetPath(`${root}/attack.gif`), damage: assetPath(`${root}/damage.gif`), morte: assetPath(`${root}/death.gif`),
    magia: id === "assassin" ? "" : base.magia };
}
