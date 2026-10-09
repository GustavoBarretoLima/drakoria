# Drakoria — 27 equipamentos

Análise da branch local main: shared/src/types/equipment.ts, equipmentRarity.ts e shared/src/loot/dungeonLoot.ts. Nove espaços por classe; grimório ocupa shield para mago. Foram criados três conjuntos visuais, sem bônus de conjunto inventados.

PNG transparente em 64, 128 e 256 pixels. Catálogo JSON e módulo TypeScript compatíveis com EquipmentItem. Itens raros de nível 20: atributos seguem Math.round(base × (1 + 19 × 0.08) × 1.5), preço de venda 102 ouro conforme dungeonLoot. IDs exclusivos.

## Adição ao projeto

1. Copiar os 27 PNGs de icones_256 para img/itens/novos.
2. Copiar novosEquipamentos.ts para shared/src/equipment.
3. Registrar os itens no catálogo canônico e nas fontes de recompensas desejadas, inclusive na validação do servidor. Apenas colocar imagens não habilita drops.
4. Preservar as restrições atuais: Berserk exige machado de duas mãos e não usa escudo; Assassino exige suas armas específicas. Estes conjuntos são das classes básicas, sem novas armas de subclasse.

Pacote preparado para adição; repositório não alterado. A main consultada é a referência local, sem atualização remota. Não foram criados efeitos únicos que exigiriam novas regras de combate.

Arte gerada com a ferramenta integrada de imagens. Prompts: nove ícones por conjunto, fantasia anime JRPG, fundo transparente; Guerreiro de aço/bronze e rubis com leão; Mago azul/prateado com safiras e estrelas; Arqueiro de couro verde com esmeraldas e falcão. Ordem: arma, armadura, escudo/offhand, pernas, botas, luvas, anel, brinco e colar.
