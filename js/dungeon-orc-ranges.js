const DUNGEON_ORC_CONFIG = {
  iniciante: {
    id: "dungeon-orc-1-5",
    label: "Covil Orc I",
    minLevel: 1,
    maxLevel: 5,
    miniBossChance: 0,
  },
  avancada: {
    id: "dungeon-orc-5-15",
    label: "Covil Orc II",
    minLevel: 5,
    maxLevel: 15,
    miniBossChance: 0.15,
    miniBossLevel: 15,
  },
};

function dungeonOrcRandomInt(min, max) {
  const safeMin = Math.ceil(min);
  const safeMax = Math.floor(max);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

function dungeonOrcPickMonster(config) {
  const roll = Math.random();

  if (config.miniBossChance > 0 && roll < config.miniBossChance) {
    const level = config.miniBossLevel || config.maxLevel;
    return {
      monsterId: `orc-warlord-mini-boss-lvl-${level}`,
      type: "mini-boss",
      level,
    };
  }

  const level = dungeonOrcRandomInt(config.minLevel, config.maxLevel);
  const familyRoll = config.miniBossChance > 0
    ? (roll - config.miniBossChance) / (1 - config.miniBossChance)
    : roll;
  const family = familyRoll < 0.5 ? "goblin" : "orc";

  return {
    monsterId: `${family}-normal-lvl-${level}`,
    type: family,
    level,
  };
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
    <div class="panel-header">
      <div>
        <span class="panel-kicker">Portão das Dungeons</span>
        <h2>Dungeons Orc</h2>
      </div>
    </div>

    <div class="dungeon-tier-list">
      <article class="dungeon-tier-card">
        <div>
          <span class="panel-kicker">Níveis 1–5</span>
          <h3>Covil Orc I</h3>
          <p>Encontros aleatórios com Goblins e Orcs entre os níveis 1 e 5.</p>
        </div>
        <button type="button" onclick="entrarDungeonOrc1a5()">Entrar</button>
      </article>

      <article class="dungeon-tier-card">
        <div>
          <span class="panel-kicker">Níveis 5–15</span>
          <h3>Covil Orc II</h3>
          <p>Goblins e Orcs aparecem entre os níveis 5 e 15. O Senhor da Guerra Orc, quando surge, é sempre Nv.15.</p>
          <small>Mini-Boss Nv.15: 15% de chance por encontro.</small>
        </div>
        <button type="button" onclick="entrarDungeonOrc5a15()">Entrar</button>
      </article>
    </div>

    <div class="painel-acoes">
      <button type="button" onclick="fecharPainelPraca()">Voltar</button>
    </div>
  `;
}

function entrarDungeonOrc1a5() {
  dungeonOrcStart(DUNGEON_ORC_CONFIG.iniciante);
}

function entrarDungeonOrc5a15() {
  dungeonOrcStart(DUNGEON_ORC_CONFIG.avancada);
}

function entrarMiniBossOrcDaFaixa() {
  const config = DUNGEON_ORC_CONFIG.avancada;
  const level = config.miniBossLevel || 15;
  localStorage.setItem("tipoBatalhaAtual", "dungeon-mini-boss-orc");
  localStorage.setItem("monsterIdAtual", `orc-warlord-mini-boss-lvl-${level}`);
  localStorage.setItem("dungeonAtual", config.id);
  localStorage.setItem("dungeonEncontroTipo", "mini-boss");
  localStorage.setItem("dungeonEncontroNivel", String(level));
  window.location.href = "batalha.html";
}

window.abrirDungeon = abrirDungeonOrcPorFaixa;
window.entrarDungeonOrc1a5 = entrarDungeonOrc1a5;
window.entrarDungeonOrc5a15 = entrarDungeonOrc5a15;
window.entrarDungeonAleatoria = entrarDungeonOrc1a5;
window.entrarDungeonGoblin = entrarDungeonOrc1a5;
window.entrarDungeonOrc = entrarDungeonOrc5a15;
window.entrarMiniBossOrc = entrarMiniBossOrcDaFaixa;
