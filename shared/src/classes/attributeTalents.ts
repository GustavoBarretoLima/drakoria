import { BERSERK_PATHS } from "./berserkTree.js";
import type { SubclassId } from "./subclasses.js";
import type { TalentNode } from "./skillTrees.js";
import type { Stats } from "../types/combat.js";

type Attribute = [string, keyof Stats, number];
// Values are per rank. Percentages scale the pre-tree stat; chances use percentage points.
export const ATTRIBUTE_PROFILES: Record<SubclassId, Attribute[]> = {
  paladin: [["Bastião Sagrado", "defense", 3], ["Vigor do Guardião", "maxHp", 3], ["Resistência à Profanação", "magicDefense", 3], ["Força Consagrada", "attack", 2], ["Reserva de Luz", "maxMana", 3], ["Disciplina do Escudo", "defense", 2]],
  berserker: [["Força Primal", "attack", 3], ["Corpo de Aço", "maxHp", 3], ["Ritmo da Fúria", "speed", 2], ["Impacto Selvagem", "criticalDamage", 3], ["Armadura de Sangue", "defense", 2], ["Precisão Brutal", "criticalChance", 1]],
  swordsman: [["Força do Duelista", "attack", 3], ["Guarda da Lâmina", "defense", 2], ["Cadência Perfeita", "speed", 2], ["Fio Implacável", "criticalDamage", 3], ["Fôlego do Duelista", "maxHp", 3], ["Leitura de Combate", "dodgeChance", 1]],
  necromancer: [["Potência das Almas", "magicPower", 3], ["Vitalidade Sepulcral", "maxHp", 3], ["Reserva Funesta", "maxMana", 3], ["Domínio Espectral", "magicPower", 2], ["Manto Espiritual", "magicDefense", 3], ["Ossos Reforçados", "defense", 2]],
  warlock: [["Potência Profana", "magicPower", 3], ["Essência do Pacto", "maxMana", 3], ["Proteção Oculta", "magicDefense", 3], ["Malícia Arcana", "criticalDamage", 3], ["Vigor Profano", "maxHp", 3], ["Precisão Maldita", "criticalChance", 1]],
  elementalist: [["Potência Elemental", "magicPower", 3], ["Fluxo dos Elementos", "maxMana", 3], ["Ritmo do Raio", "speed", 2], ["Convergência Arcana", "criticalChance", 1], ["Barreira Elemental", "magicDefense", 3], ["Foco Superior", "magicPower", 2]],
  assassin: [["Força das Adagas", "attack", 3], ["Passo Fantasma", "dodgeChance", 1], ["Reflexos Mortais", "speed", 2], ["Golpe Cirúrgico", "criticalDamage", 3], ["Vigor das Sombras", "maxHp", 2], ["Precisão Assassina", "criticalChance", 1]],
  hunter: [["Força do Arco", "attack", 3], ["Resistência Selvagem", "maxHp", 3], ["Agilidade do Falcão", "speed", 2], ["Mira da Caçada", "criticalChance", 1], ["Couro Resistente", "defense", 2], ["Evasão do Caçador", "dodgeChance", 1]],
  "dark-elf": [["Força do Eclipse", "attack", 2], ["Essência Sombria", "magicPower", 3], ["Passos do Crepúsculo", "speed", 2], ["Precisão do Eclipse", "criticalChance", 1], ["Reserva do Crepúsculo", "maxMana", 3], ["Manto da Noite", "magicDefense", 3]],
};
const labels: Partial<Record<keyof Stats, string>> = { attack: "ataque físico (força)", defense: "defesa física", magicPower: "poder mágico", magicDefense: "defesa mágica", maxHp: "vida máxima", maxMana: "mana máxima", speed: "velocidade", criticalChance: "chance crítica", criticalDamage: "dano crítico", dodgeChance: "esquiva" };
export function createAttributeTalents(id: SubclassId): TalentNode[] {
  return ATTRIBUTE_PROFILES[id].map(([name, stat, amount], index) => {
    const advanced = index >= 3;
    const parent = advanced ? `${id}-attribute-${index - 3}` : id === "berserker" ? ["berserker-brutal", "berserker-instinct", "berserker-iron"][index]! : `${id}-foundation`;
    const unit = ["criticalChance", "criticalDamage", "dodgeChance"].includes(stat) ? " pontos percentuais" : "%";
    return { id: `${id}-attribute-${index}`, name, level: advanced ? 20 : 5, maxRank: 3, attributeBranch: true,
      requires: id === "berserker" && !advanced ? [] : [{ id: parent, rank: advanced ? 2 : 1 }],
      ...(id === "berserker" ? { path: BERSERK_PATHS[[0, 2, 1][index % 3]!] } : {}), bonus: { [stat]: amount },
      description: `+${amount}${unit} de ${labels[stat]} por rank. Máximo: +${amount * 3}${unit}. ${unit === "%" ? "Calculado sobre o atributo antes dos talentos, incluindo equipamentos e subclasse; não multiplica outros talentos." : "Soma direta à chance ou ao multiplicador; respeita os limites do combate."}` };
  });
}
