import type { SubclassId } from "./subclasses.js";
export const SUBCLASS_SPRITE_FOLDERS: Record<SubclassId, { masculino: string; feminino: string }> = {
 paladin: { masculino: "paladino", feminino: "paladina" }, berserker: { masculino: "berserk_primal", feminino: "berserk_feminina" },
 swordsman: { masculino: "espadachim", feminino: "espadachim_feminina" }, necromancer: { masculino: "necromante", feminino: "necromante_feminina" },
 warlock: { masculino: "bruxo", feminino: "bruxa" }, elementalist: { masculino: "mago_elemental", feminino: "maga_elemental" },
 assassin: { masculino: "assassino", feminino: "assassina" }, hunter: { masculino: "cacador", feminino: "cacadora" }, "dark-elf": { masculino: "elfo_negro", feminino: "elfa_negra" },
};
