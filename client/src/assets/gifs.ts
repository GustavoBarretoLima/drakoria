function assetPath(path: string): string {
  const normalizedPath = path.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}

export const gifsHeroi = {
  guerreiro: {
    Masculino: {
      padrao: assetPath("img/personagens/guerreiro.gif"),
      atk: assetPath("img/personagens/guerreiro-ataque.gif"),
      defesa: assetPath("img/personagens/guerreiro-defesa.gif"),
      damage: assetPath("img/personagens/guerreiro-dano.gif"),
      magia: assetPath("img/skills/Slash.gif"),
    },
    Feminino: {
      padrao: assetPath("img/personagens/guerreira.gif"),
      atk: assetPath("img/personagens/guerreira-ataque.gif"),
      defesa: assetPath("img/personagens/guerreira-defesa.gif"),
      damage: assetPath("img/personagens/guerreira-dano.gif"),
      magia: assetPath("img/skills/Slash.gif"),
    },
  },
  mago: {
    Masculino: {
      padrao: assetPath("img/personagens/mago.gif"),
      atk: assetPath("img/personagens/mago-ataque.gif"),
      defesa: assetPath("img/personagens/mago-defesa.gif"),
      damage: assetPath("img/personagens/mago-dano.gif"),
      magia: assetPath("img/skills/Orb.gif"),
    },
    Feminino: {
      padrao: assetPath("img/personagens/maga.gif"),
      atk: assetPath("img/personagens/maga-ataque.gif"),
      defesa: assetPath("img/personagens/maga-defesa.gif"),
      damage: assetPath("img/personagens/maga-dano.gif"),
      magia: assetPath("img/skills/Orb.gif"),
    },
  },
  arqueiro: {
    Masculino: {
      padrao: assetPath("img/personagens/arqueiro.gif"),
      atk: assetPath("img/personagens/arqueiro-ataque.gif"),
      defesa: assetPath("img/personagens/arqueiro-defesa.gif"),
      damage: assetPath("img/personagens/arqueiro-dano.gif"),
      magia: assetPath("img/skills/Flecha.gif"),
    },
    Feminino: {
      padrao: assetPath("img/personagens/arqueira.gif"),
      atk: assetPath("img/personagens/arqueira-ataque.gif"),
      defesa: assetPath("img/personagens/arqueira-defesa.gif"),
      damage: assetPath("img/personagens/arqueira-dano.gif"),
      magia: assetPath("img/skills/Flecha.gif"),
    },
  },
} as const;

export const gifsGoblin = {
  padrao: assetPath("img/monstros/goblin.gif"),
  atk: assetPath("img/monstros/goblin-ataque.gif"),
  damage: assetPath("img/monstros/goblin-dano.gif"),
  morte: assetPath("img/monstros/goblin-dano.gif"),
} as const;
