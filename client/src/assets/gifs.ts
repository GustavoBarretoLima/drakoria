import type { MonsterSpriteSet } from "../../../shared/src/types/monster.js";

function assetPath(path: string): string {
  const normalizedPath = path.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
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

/** The subclass changes appearance while retaining the warrior combat identity. */
export function getHeroGifs(className: keyof typeof gifsHeroi, gender: "Masculino" | "Feminino", subclassId?: string) {
  const base = gifsHeroi[className][gender];
  if (className !== "guerreiro" || subclassId !== "berserker") return { ...base, morte: base.damage };
  return {
    ...base,
    padrao: assetPath("img/personagens/berserk_primal/idle.gif"),
    defesa: assetPath("img/personagens/berserk_primal/idle.gif"),
    atk: assetPath("img/personagens/berserk_primal/attack.gif"),
    damage: assetPath("img/personagens/berserk_primal/damage.gif"),
    morte: assetPath("img/personagens/berserk_primal/death.gif"),
  };
}
