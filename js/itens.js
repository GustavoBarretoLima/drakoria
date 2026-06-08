// Itens básicos (equipamentos)
const itensBasicos = [
  {
    nome: "Espada de Ferro",
    tipo: "arma", // 🔹 minúsculo e igual ao slot
    raridade: "Comum",
    descricao: "Uma espada simples feita de ferro. Ideal para iniciantes.",
    consumivel: false,
    classePermitida: ["Guerreiro"],
    icone: "/img/itens/espada_ferro.png",
    stats: { ataque: 10, durabilidade: 100 },
  },
  {
    nome: "Escudo de Madeira",
    tipo: "escudo", // 🔹 ajustado para bater com slot
    raridade: "Comum",
    descricao: "Um escudo básico feito de madeira. Oferece proteção moderada.",
    consumivel: false,
    classePermitida: ["Guerreiro"],
    icone: "/img/itens/escudo_madeira.png",
    stats: { defesa: 5, durabilidade: 80 },
  },
  {
    nome: "Cajado de Madeira",
    tipo: "arma",
    raridade: "comum",
    descricao:
      "Um cajado simples feito de madeira. Ideal para magos iniciantes.",
    consumivel: false,
    classePermitida: ["mago"], // ✅ precisa ser array e minúsculo
    icone: "/img/itens/cajado_madeira.png",
    stats: { ataque: 8, durabilidade: 60 },
  },
  {
    nome: "Arco de Madeira",
    tipo: "arma",
    raridade: "comum",
    descricao:
      "Um arco básico feito de madeira. Perfeito para arqueiros iniciantes.",
    consumivel: false,
    classePermitida: ["arqueiro"], // ✅ agora é array e minúsculo
    icone: "/img/itens/arco_madeira.png",
    stats: { ataque: 9, durabilidade: 70 },
  },
];

// Itens consumíveis
const itensConsumiveis = [
  {
    nome: "Poção de Vida",
    tipo: "consumivel", // 🔹 bate com lógica de não equipar
    raridade: "Comum",
    descricao: "Restaura 20 pontos de vida ao ser consumida.",
    consumivel: true,
    icone: "/img/itens/pocao_vida.png",
    stats: { vida: 20 },
  },
  {
    nome: "Poção de Mana",
    tipo: "consumivel",
    raridade: "Comum",
    descricao: "Restaura 10 pontos de mana ao ser consumida.",
    consumivel: true,
    icone: "/img/itens/pocao_mana.png",
    stats: { mana: 10 },
  },
];

// Exporta para uso no inventário
const todosItens = [...itensBasicos, ...itensConsumiveis];
