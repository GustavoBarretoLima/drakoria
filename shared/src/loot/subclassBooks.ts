import {
  SUBCLASS_DEFINITIONS,
  SUBCLASS_IDS,
  type SubclassId,
} from "../classes/subclasses.js";
import { isTestCharacter } from "../testing/testCharacter.js";

export const SUBCLASS_BOOK_DROP_CHANCE = 0.005;

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
  const chance = isTestCharacter(heroName) ? 1 : SUBCLASS_BOOK_DROP_CHANCE;
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
