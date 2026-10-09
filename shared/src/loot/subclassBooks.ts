import {
  SUBCLASS_DEFINITIONS,
  SUBCLASS_IDS,
  type SubclassId,
} from "../classes/subclasses.js";
import { isTestCharacter } from "../testing/testCharacter.js";

// Base chance remains compatible with legacy bosses below level 15.
export const SUBCLASS_BOOK_DROP_CHANCE = 0.005;
export const SUBCLASS_BOOK_MAX_DROP_CHANCE = 0.009;

/** +0.01 percentage point per level above 15, capped at 0.9%. */
export function getSubclassBookDropChance(monsterId: string): number {
  if (!isBossMonsterId(monsterId)) return 0;
  const level = Number(monsterId.match(/-boss-lvl-(\d+)$/)?.[1]);
  if (!Number.isSafeInteger(level) || level < 1) return 0;
  const basisPoints = Math.min(90, 50 + Math.max(0, level - 15));
  return basisPoints / 10000;
}

export interface SubclassBookDrop {
  bookId: string;
  subclassId: SubclassId;
  name: string;
  description: string;
  quantity: number;
}

export function isBossMonsterId(monsterId: string): boolean {
  return !monsterId.includes("-mini-boss-") && /-boss-lvl-\d+$/.test(monsterId);
}

export function rollSubclassBookDrops(
  monsterId: string,
  random: () => number = Math.random,
  heroName?: string,
): SubclassBookDrop[] {
  if (!isBossMonsterId(monsterId)) return [];
  const normalChance = getSubclassBookDropChance(monsterId);
  if (normalChance === 0) return [];
  const chance = isTestCharacter(heroName) ? 1 : normalChance;
  if (random() >= chance) return [];

  const index = Math.min(
    SUBCLASS_IDS.length - 1,
    Math.floor(Math.max(0, random()) * SUBCLASS_IDS.length),
  );
  const subclassId = SUBCLASS_IDS[index]!;
  const definition = SUBCLASS_DEFINITIONS[subclassId];

  return [
    {
      bookId: `subclass-book-${subclassId}`,
      subclassId,
      name: definition.bookName,
      description: `Livro extremamente raro. Permite a especialização em ${definition.name}.`,
      quantity: 1,
    },
  ];
}
