# Drakoria — Árvore do Berserk

Proposta original de habilidades e balanceamento. A imagem é um conceito visual; os tipos, requisitos e efeitos abaixo são a especificação. Aplica-se às versões masculina e feminina.

## Regras

- Despertar Berserk é concedido ao obter a subclasse e libera a árvore.
- Fúria: recurso de 0 a 100. Ataques básicos que acertam geram 8; receber dano direto de inimigo gera 4, no máximo uma vez por segundo. Fora de combate, perde 5 por segundo após 5 segundos.
- Cada nó custa 1 ponto, tem um único grau e exige o nó anterior do mesmo caminho. É permitido investir em vários caminhos.
- Os seis patamares de cada caminho exigem respectivamente 1, 3, 5, 8, 12 e 16 pontos já investidos na árvore. O requisito global soma os três caminhos.
- Apenas uma habilidade final pode ser aprendida. Ativas aprendidas podem ser equipadas em quatro espaços; passivas ficam sempre aplicadas.
- Dano é percentual do ataque físico final. Sangramento não causa críticos. Cura por dano considera o dano efetivamente causado, sem excesso sobre a vida restante, e é reduzida a um terço em ataques de área.
- Valores iniciais sujeitos a testes; nenhuma alteração foi integrada ao jogo.

## Raiz — Despertar Berserk

Libera Fúria e uso de machados de duas mãos. As habilidades da árvore exigem essa arma.

## Carnificina — golpes, sangramento e execução

| Ordem | Habilidade | Tipo | Efeito proposto |
|---|---|---|---|
| 1 | Golpe Brutal | Ativa | 160% de dano em um alvo; gera 12 de Fúria. Recarga: 5 s. |
| 2 | Lâmina Voraz | Passiva | Cura 3% do dano físico causado por ataques e habilidades. |
| 3 | Corte Devastador | Ativa | 240% de dano em cone frontal. Custo: 25 de Fúria; recarga: 8 s. |
| 4 | Ferida Profunda | Passiva | Golpe Brutal e Corte Devastador aplicam sangramento de 60% ao longo de 4 s. Reaplicação renova a duração, sem acumular. |
| 5 | Turbilhão Selvagem | Ativa | Giro em área por 2 s, quatro golpes de 70%. Custo: 40 de Fúria; recarga: 12 s. |
| 6 | Executor | Final ativa | 450% de dano em um alvo, aumentado em 50% contra alvos com menos de 30% de vida. Custo: 60 de Fúria; recarga: 35 s. |

## Fúria Primal — ritmo, mobilidade e transformação

| Ordem | Habilidade | Tipo | Efeito proposto |
|---|---|---|---|
| 1 | Instinto Selvagem | Passiva | Aumenta em 20% toda a Fúria gerada. Mantém o máximo de 100. |
| 2 | Grito de Guerra | Ativa | Gera 20 de Fúria e concede 15% de velocidade de ataque por 6 s. Recarga: 20 s. |
| 3 | Fúria Crescente | Passiva | Acertos básicos concedem 2% de dano por 4 s, até cinco acúmulos; novos acertos renovam a duração de todos. |
| 4 | Investida Feral | Ativa | Avança até um inimigo, causa 140% de dano e o desacelera em 40% por 2 s. Custo: 15 de Fúria; recarga: 10 s. |
| 5 | Êxtase de Batalha | Passiva | Enquanto tiver 60 ou mais de Fúria, ganha 10% de chance de crítico. |
| 6 | Avatar da Fúria | Final ativa | Transformação por 8 s: +25% de dano, +25% de velocidade de ataque e +15% de dano recebido. Custo: 80 de Fúria; recarga: 45 s. |

## Sangue de Ferro — resistência e retaliação

| Ordem | Habilidade | Tipo | Efeito proposto |
|---|---|---|---|
| 1 | Pele de Ferro | Passiva | Reduz em 6% o dano físico recebido. |
| 2 | Vigor Indomável | Passiva | Aumenta a vida máxima em 12%. |
| 3 | Sangue por Sangue | Ativa | Por 5 s, cura 10% do dano físico causado por ataques e habilidades. Soma-se a Lâmina Voraz. Custo: 30 de Fúria; recarga: 20 s. |
| 4 | Retaliação | Passiva | Após receber um acerto físico direto de inimigo, o próximo ataque básico causa 25% de dano adicional. Não acumula; expira em 4 s; intervalo mínimo: 3 s. |
| 5 | Recusar a Morte | Passiva | Um golpe fatal deixa 1 de vida e concede 90% de redução de dano por 1 s. Recarga interna: 90 s. Não evita efeitos de execução explícita. |
| 6 | Titã Imortal | Final ativa | Por 6 s, reduz todo dano recebido em 40% e impede empurrões. Ao ativar, cura 15% da vida máxima. Custo: 70 de Fúria; recarga: 45 s. |

## Direções para os ícones e efeitos

Carnificina: machado, cortes e sangue; vermelho escuro. Fúria Primal: lobo, rugido e fogo; laranja. Sangue de Ferro: pele metálica, coração e escudo; bronze e aço. Destacar ativas e finais com molduras próprias na implementação; o conceito ilustrado não substitui a interface funcional.

## Referências pesquisadas

- Path of Exile, árvore conectada: https://www.pathofexile.com/passive-skill-tree
- Hero Siege, classes e especialização Berserker: https://playherosiege.com/en
- Final Fantasy XIV, Warrior, fúria e machados: https://na.finalfantasyxiv.com/jobguide/warrior/

Arte criada com a ferramenta integrada de imagens. Prompt resumido: árvore original de fantasia sombria para Drakoria, 19 nós, raiz Despertar Berserk, três caminhos ascendentes, ícones de machados, fúria e resistência, conexões visíveis, molduras de bronze e rótulos em português.
