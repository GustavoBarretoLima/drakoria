import type { TalentNode } from "./skillTrees.js";
import type { ClassSkill } from "../combat/classSkills.js";
export const BERSERK_PATHS = ["Carnificina", "Fúria Primal", "Sangue de Ferro"] as const;
const paths = [
  [
    ["brutal", "Golpe Brutal", "160% do ataque físico. Ao acertar, gera 12 de Fúria.", 1.6, 0, 2, 1],
    ["voracious", "Lâmina Voraz", "Cura 3% do dano físico efetivamente causado.", 0, 0, 0, 0],
    ["devastating", "Corte Devastador", "240% do ataque físico no alvo atual. Cura por dano reduzida a um terço.", 2.4, 25, 3, 1],
    ["wound", "Ferida Profunda", "Golpe Brutal e Corte Devastador aplicam 60% do ataque em sangramento por duas ações suas. Renova, sem acumular ou causar críticos.", 0, 0, 0, 0],
    ["whirlwind", "Turbilhão Selvagem", "Quatro golpes de 70% do ataque no alvo atual. Cura por dano reduzida a um terço.", .7, 40, 4, 4],
    ["executor", "Executor", "450% do ataque; +50% de dano contra alvos abaixo de 30% de vida.", 4.5, 60, 10, 1],
  ],
  [
    ["instinct", "Instinto Selvagem", "+20% de toda a Fúria gerada; limite de 100.", 0, 0, 0, 0],
    ["warcry", "Grito de Guerra", "Gera 20 de Fúria e acelera o ATB em 15% por duas ações suas.", 0, 0, 6, 0],
    ["crescendo", "Fúria Crescente", "Acertos básicos acumulam +2% de dano, até cinco vezes. Dura duas ações suas; acertos renovam.", 0, 0, 0, 0],
    ["charge", "Investida Feral", "140% do ataque e reduz a velocidade do ATB inimigo em 40% até sua próxima ação.", 1.4, 15, 3, 1],
    ["ecstasy", "Êxtase de Batalha", "+10 pontos de chance crítica enquanto tiver pelo menos 60 de Fúria.", 0, 0, 0, 0],
    ["avatar", "Avatar da Fúria", "Por três ações suas: +25% de dano, +25% de velocidade do ATB e +15% de dano recebido.", 0, 80, 12, 0],
  ],
  [
    ["iron", "Pele de Ferro", "Reduz o dano físico recebido em 6%.", 0, 0, 0, 0],
    ["vigor", "Vigor Indomável", "+12% de vida máxima.", 0, 0, 0, 0],
    ["blood", "Sangue por Sangue", "Por duas ações suas, cura 10% do dano físico causado. Soma-se a Lâmina Voraz.", 0, 30, 6, 0],
    ["retaliation", "Retaliação", "Após dano físico direto, o próximo ataque básico causa +25% de dano. Não acumula, expira em duas ações suas e só rearma após uma ação sua.", 0, 0, 0, 0],
    ["refuse", "Recusar a Morte", "Uma vez por batalha, dano fatal deixa 1 HP e concede 90% de redução até sua próxima ação.", 0, 0, 0, 0],
    ["titan", "Titã Imortal", "Cura 15% da vida máxima e reduz todo dano recebido em 40% por duas ações suas.", 0, 70, 12, 0],
  ],
] as const;
const thresholds = [1, 3, 5, 8, 12, 16];
export const BERSERK_NODES: TalentNode[] = [];
// Tier order lets global requirements count investments across all three paths.
for (let tier = 0; tier < 6; tier++) for (let path = 0; path < 3; path++) {
  const [suffix, name, description, powerMultiplier, furyCost, cooldown, hits] = paths[path]![tier]!;
  const active = cooldown > 0;
  const id = `berserker-${suffix}`;
  const skill: ClassSkill | undefined = active ? { id: id as ClassSkill["id"], name, description, heroClass: "guerreiro", subclassId: "berserker", unlockLevel: 1, manaCost: 0, furyCost, cooldown, damageType: "physical", powerMultiplier, hits, defenseMultiplier: 1, criticalBonus: 0, effect: "berserk" } : undefined;
  BERSERK_NODES.push({ id, name, description, level: 1, maxRank: 1, path: BERSERK_PATHS[path]!, tier: tier + 1, requiredPoints: thresholds[tier]!, final: tier === 5,
    requires: tier ? [{ id: `berserker-${paths[path]![tier - 1]![0]}`, rank: 1 }] : [],
    ...(suffix === "vigor" ? { bonus: { maxHp: 12 } } : {}), ...(skill ? { skill } : {}) });
}
