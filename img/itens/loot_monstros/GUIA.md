# Drakoria — Equipamentos dos monstros

16 peças originais; 48 PNGs transparentes em 64, 128 e 256 pixels. Catálogo no formato EquipmentItem e tabela separada de drops. Valores e chances são propostas para balanceamento, não drops já ativos.

| Equipamento | Monstro | Raridade | Nível | Chance por abate |
|---|---|---|---|---|
| Faca de Sucata | Goblin | uncommon | 5 | 3% |
| Espada da Sepultura | Esqueleto Guerreiro | rare | 10 | 2% |
| Brinco da Presa Mutante | Rato Mutante | uncommon | 5 | 3% |
| Cutelo do Saqueador | Orc | rare | 10 | 2% |
| Manoplas do Hobgoblin | Hobgoblin | rare | 10 | 3% |
| Couraça do Carrasco | Hobgoblin Elite | epic | 20 | 6% |
| Escudo do Senhor da Guerra | Senhor da Guerra Orc | epic | 20 | 8% |
| Machado da Coroa Sangrenta | Rei Orc | legendary | 30 | 3% |
| Luvas da Teia Pestilenta | Aranha Pestilenta | rare | 15 | 2% |
| Anel da Alma Errante | Espectro do Cemitério | rare | 15 | 2% |
| Botas do Lobo Sombrio | Lobo Sombrio | rare | 15 | 2% |
| Arco da Raiz Maldita | Árvore Demoníaca | epic | 20 | 1% |
| Amuleto das Três Cabeças | Hidra da Corrupção | legendary | 30 | 3% |
| Cajado do Último Rito | Coveiro Maldito | legendary | 30 | 3% |
| Gibão da Fera Colossal | Lobo Mutante Gigante | legendary | 30 | 3% |
| Medalhão do Rei Orc | Rei Orc | legendary | 30 | 2% |

## Integração

Copiar icones_256 para img/itens/monstros. Registrar equipamentos.json no catálogo canônico do servidor e do cliente. Usar drops_propostos.json como tabela adicional ao loot atual: chance absoluta por abate, uma rolagem independente por entrada, somente se o nível do monstro for igual ou superior ao requisito. O identificador completo do monstro recebe o sufixo -lvl-N; monsterBaseId omite esse sufixo. Dois itens do Rei Orc têm rolagens independentes e podem cair juntos.

Faca de Sucata exige Assassino. Machado da Coroa Sangrenta exige Berserk, duas mãos. Para outros heróis, a recompensa pode permanecer no inventário, mas não deve burlar canEquipItem. Adaptadores de armas de subclasse devem preservar ícones e registrar IDs derivados no catálogo do servidor. Nenhum efeito único novo foi inventado; os atributos usam os campos existentes. Atributos dos itens universais seguem peças equivalentes com mana ou defesa; ainda precisam de balanceamento.

Repositório não alterado; pacote preparado para adição. Referência do projeto: monstros e tipos consultados na main local na tarefa anterior. Não há bônus de conjunto ou resistência a veneno que exigiriam campos novos.

## Pesquisa e arte

Referência de recompensas exclusivas de chefes: https://webcdn.pathofexile.com/forum/view-thread/1930316/filter-account-type/staff
Referência de itens únicos: https://ftp.blizzard.com/pub/misc/Diablo.PDF

Arte criada com a ferramenta integrada de imagens. Prompt: 16 equipamentos originais de fantasia anime, armas e peças usáveis ligados aos monstros de Drakoria, ossos, presas, quitina, raízes e almas; grade 4x4, fundo transparente, sem texto. Recortes e montagem preservam alpha.
