const DUNGEON_ORC_CONFIG = {
  iniciante: { id: "dungeon-orc-1-10", label: "Covil dos Goblins e Orcs", minLevel: 1, maxLevel: 10, monsters: ["goblin", "orc"], description: "Goblins e Orcs em encontros de níveis 1 a 10." },
  cripta: { id: "dungeon-mutants", label: "Cripta dos Mutantes", minLevel: 1, maxLevel: 10, monsters: ["skeleton-warrior", "mutant-rat"], description: "Esqueletos Guerreiros e Ratos Mutantes em encontros de níveis 1 a 10." },
  avancada: { id: "dungeon-hobgoblin", label: "Acampamento Hobgoblin", minLevel: 10, maxLevel: 15, monsters: ["hobgoblin"], eliteChance: 0.20, description: "Hobgoblins de níveis 10 a 15. Chance de elite: 20%; mais forte, com drops raros e épicos." },
  fortaleza: { id: "dungeon-orc-king", label: "Trono do Orc Rei", minLevel: 15, maxLevel: 25, monsters: ["orc-king"], rank: "boss", description: "Orc Rei de níveis 15 a 25. Um equipamento elite garantido: raro (40%) ou épico (60%)." },
};

function dungeonOrcRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dungeonOrcPickMonster(config) {
  const type = config.monsters[dungeonOrcRandomInt(0, config.monsters.length - 1)];
  const level = dungeonOrcRandomInt(config.minLevel, config.maxLevel);
  const rank = config.rank || (config.eliteChance && Math.random() < config.eliteChance ? "elite" : "normal");
  return { monsterId: `${type}-${rank}-lvl-${level}`, type: rank === "normal" ? type : rank, level };
}

function dungeonOrcStart(config) {
  const encounter = dungeonOrcPickMonster(config);
  localStorage.setItem("tipoBatalhaAtual", config.id);
  localStorage.setItem("monsterIdAtual", encounter.monsterId);
  localStorage.setItem("dungeonAtual", config.id);
  localStorage.setItem("dungeonNivelMin", String(config.minLevel));
  localStorage.setItem("dungeonNivelMax", String(config.maxLevel));
  localStorage.setItem("dungeonEncontroTipo", encounter.type);
  localStorage.setItem("dungeonEncontroNivel", String(encounter.level));
  window.location.href = "batalha.html";
}

function abrirDungeonOrcPorFaixa() {
  const painel = document.getElementById("painelPraca");
  if (!painel) return;
  painel.classList.remove("hidden");
  painel.innerHTML = `
    <div class="panel-header"><div><span class="panel-kicker">Portão das Dungeons</span><h2>Dungeons de Drakoria</h2></div></div>
    <div class="dungeon-tier-list">${Object.entries(DUNGEON_ORC_CONFIG).map(([key, config]) => `
      <article class="dungeon-tier-card"><div>
        <span class="panel-kicker">Níveis ${config.minLevel}–${config.maxLevel}</span>
        <h3>${config.label}</h3><p>${config.description}</p>
      </div><button type="button" onclick="entrarDungeonPorFaixa('${key}')">Entrar</button></article>
    `).join("")}</div>
    <details class="dungeon-tier-card"><summary>Guia de equipamentos e drops</summary><div>
      <p>Cada drop exige o nível do monstro derrotado. As três classes e os nove slots têm chances iguais. Você pode guardar ou vender equipamentos de outras classes.</p>
      <p>Guerreiro: espadas e placas. Mago: cajados e tecido leve. Arqueiro: arcos e couro leve. Mão secundária: escudo, grimório ou broquel, conforme a classe.</p>
      <div class="dungeon-loot-table"><table>
        <thead><tr><th>Slot</th><th>Guerreiro</th><th>Mago</th><th>Arqueiro</th></tr></thead>
        <tbody>
          <tr><td>Arma</td><td>Espada de Ferro</td><td>Cajado Rúnico</td><td>Arco Longo</td></tr>
          <tr><td>Armadura</td><td>Couraça de Placas</td><td>Manto de Seda</td><td>Gibão de Couro</td></tr>
          <tr><td>Mão secundária</td><td>Escudo de Aço</td><td>Grimório Arcano</td><td>Broquel de Couro</td></tr>
          <tr><td>Pernas</td><td>Grevas de Placas</td><td>Calças de Linho</td><td>Calças de Couro</td></tr>
          <tr><td>Botas</td><td>Botas de Ferro</td><td>Botas de Tecido</td><td>Botas do Batedor</td></tr>
          <tr><td>Luvas</td><td>Manoplas de Aço</td><td>Luvas de Seda</td><td>Luvas do Atirador</td></tr>
          <tr><td>Anel</td><td>Anel de Vigor</td><td>Anel Arcano</td><td>Anel da Precisão</td></tr>
          <tr><td>Brinco</td><td>Brinco de Bravura</td><td>Brinco de Safira</td><td>Brinco do Falcão</td></tr>
          <tr><td>Colar</td><td>Medalhão do Guardião</td><td>Amuleto da Sabedoria</td><td>Pingente do Caçador</td></tr>
        </tbody>
      </table></div>
      <p>Qualidades: Recruta (comum), Veterano (incomum), Elite (raro) e Soberano (épico). Cada peça tem uma versão por nível do monstro.</p>
      <p>Goblins, Orcs, Esqueletos e Ratos: 35% de chance de drop; comum 70%, incomum 25%, raro 5%. Hobgoblin: 45%; incomum 75%, raro 25%. Elite: 85%; raro 80%, épico 20%. Boss: 100%; raro 40%, épico 60%. As raridades são sorteadas após o drop.</p>
    </div></details>
    <div class="painel-acoes"><button type="button" onclick="fecharPainelPraca()">Voltar</button></div>`;
}

window.entrarDungeonPorFaixa = key => {
  const config = DUNGEON_ORC_CONFIG[key];
  if (config) dungeonOrcStart(config);
};
window.abrirDungeon = abrirDungeonOrcPorFaixa;
// Compatibilidade com os botões e atalhos legados da Praça.
window.entrarDungeonOrc1a5 = () => dungeonOrcStart(DUNGEON_ORC_CONFIG.iniciante);
window.entrarDungeonOrc5a15 = () => dungeonOrcStart(DUNGEON_ORC_CONFIG.avancada);
window.entrarDungeonAleatoria = window.entrarDungeonOrc1a5;
window.entrarDungeonGoblin = window.entrarDungeonOrc1a5;
window.entrarDungeonOrc = window.entrarDungeonOrc1a5;
window.entrarMiniBossOrc = () => dungeonOrcStart(DUNGEON_ORC_CONFIG.fortaleza);
window.entrarFortalezaOrcRei = window.entrarMiniBossOrc;
window.entrarCriptaMutantes = () => dungeonOrcStart(DUNGEON_ORC_CONFIG.cripta);
