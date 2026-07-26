import type { BattleState } from "../../../shared/src/types/combat.js";
import { renderStatus } from "../ui/renderStatus.js";
import { renderBattleMessage } from "../ui/renderMessages.js";
import { gifsHeroi, gifsGoblin } from "../assets/gifs.js";

let previousEventKey = "";
let victoryRedirectScheduled = false;

function getHeroGender(): "Masculino" | "Feminino" {
  const genero = (
    localStorage.getItem("generoHeroi") || "masculino"
  ).toLowerCase();
  return genero === "feminino" ? "Feminino" : "Masculino";
}

export function renderBattle(state: BattleState) {
  renderStatus(state);
  renderBattleMessage(state);
  renderTurnIndicator(state);
  renderButtons(state);
  renderSpritesBase(state);
  playBattleEventEffects(state);
  handleBattleEndRedirect(state);
}

function renderTurnIndicator(state: BattleState) {
  const indicador = document.getElementById("indicadorTurno");
  if (!indicador) return;

  const isHeroTurn = state.turnOwnerId === state.hero.id && !state.finished;

  if (state.finished) {
    indicador.textContent =
      state.winnerId === state.hero.id ? "Vitoria!" : "Derrota!";
    return;
  }

  indicador.textContent = isHeroTurn ? "Seu turno" : "Turno do inimigo";
}

function renderButtons(state: BattleState) {
  const isHeroTurn = state.turnOwnerId === state.hero.id && !state.finished;

  const btnAtacar = document.getElementById(
    "btnAtacar",
  ) as HTMLButtonElement | null;
  const btnDefender = document.getElementById(
    "btnDefender",
  ) as HTMLButtonElement | null;
  const btnMagia = document.getElementById(
    "btnMagia",
  ) as HTMLButtonElement | null;
  const btnFugir = document.getElementById(
    "btnFugir",
  ) as HTMLButtonElement | null;

  if (btnAtacar) btnAtacar.disabled = !isHeroTurn;
  if (btnDefender) btnDefender.disabled = !isHeroTurn;
  if (btnMagia) btnMagia.disabled = !isHeroTurn || state.hero.stats.mana < 10;
  if (btnFugir) btnFugir.disabled = !isHeroTurn;
}

function renderSpritesBase(state: BattleState) {
  const heroImg = document.getElementById(
    "heroiBatalha",
  ) as HTMLImageElement | null;
  const enemyImg = document.getElementById(
    "inimigoBatalha",
  ) as HTMLImageElement | null;

  if (heroImg && state.hero.className) {
    const gender = getHeroGender();
    const heroGifs = gifsHeroi[state.hero.className]?.[gender];

    if (heroGifs?.padrao) {
      heroImg.src = heroGifs.padrao;
    }
  }

  if (enemyImg) {
    enemyImg.src = state.enemy.isAlive
      ? gifsGoblin.padrao
      : (gifsGoblin.morte ?? gifsGoblin.damage ?? gifsGoblin.padrao);
  }
}

function playBattleEventEffects(state: BattleState) {
  const lastEvent = state.lastEvent;
  if (!lastEvent) return;
  if (!state.hero.className) return;

  const eventKey = [
    lastEvent.actorId,
    lastEvent.targetId,
    lastEvent.action,
    lastEvent.damage ?? "",
    lastEvent.critical ? "crit" : "normal",
    state.hero.stats.hp,
    state.enemy.stats.hp,
  ].join("|");

  if (eventKey === previousEventKey) return;
  previousEventKey = eventKey;

  const heroImg = document.getElementById(
    "heroiBatalha",
  ) as HTMLImageElement | null;
  const enemyImg = document.getElementById(
    "inimigoBatalha",
  ) as HTMLImageElement | null;
  const heroWrapper = document.querySelector(".heroi") as HTMLElement | null;
  const enemyWrapper = document.querySelector(".inimigo") as HTMLElement | null;

  if (!heroImg || !enemyImg) return;

  const gender = getHeroGender();
  const heroGifs = gifsHeroi[state.hero.className]?.[gender];

  if (!heroGifs) return;

  const heroDefaultGif = heroGifs.padrao ?? "";
  const heroAttackGif = heroGifs.atk ?? heroDefaultGif;
  const heroDefenseGif = heroGifs.defesa ?? heroDefaultGif;
  const heroDamageGif = heroGifs.damage ?? heroDefaultGif;
  const heroSkillGif = "magia" in heroGifs ? heroGifs.magia : "";

  if (lastEvent.actorId === state.hero.id) {
    if (lastEvent.action === "ATTACK") {
      heroImg.src = heroAttackGif;

      if (state.hero.className === "guerreiro") {
        dashAttack(heroImg, enemyImg, 620, true);
      }

      playHeroAttackSkillEffect(
        state.hero.className,
        heroSkillGif,
        heroImg,
        enemyImg,
      );

      setTimeout(() => {
        heroImg.src = heroDefaultGif;
      }, 700);

      setTimeout(
        () => {
          flashTarget(enemyWrapper, lastEvent.critical === true);
          spawnDamageNumber(
            enemyWrapper,
            lastEvent.damage ?? 0,
            lastEvent.critical === true,
          );

          if (!state.enemy.isAlive) {
            enemyImg.src =
              gifsGoblin.morte ?? gifsGoblin.damage ?? gifsGoblin.padrao;
          } else {
            enemyImg.src = gifsGoblin.damage ?? gifsGoblin.padrao;
            setTimeout(() => {
              enemyImg.src = gifsGoblin.padrao;
            }, 500);
          }
        },
        state.hero.className === "guerreiro" ? 320 : 0,
      );
    }

    if (lastEvent.action === "DEFEND") {
      heroImg.src = heroDefenseGif;

      setTimeout(() => {
        heroImg.src = heroDefaultGif;
      }, 700);

      pulseDefend(heroWrapper);
    }

    if (lastEvent.action === "CAST_MAGIC") {
      heroImg.src = heroAttackGif;

      playHeroMagicSkillEffect(
        state.hero.className,
        heroSkillGif,
        heroImg,
        enemyImg,
      );

      setTimeout(() => {
        heroImg.src = heroDefaultGif;
      }, 700);

      flashTarget(enemyWrapper, true);
      spawnDamageNumber(enemyWrapper, lastEvent.damage ?? 0, true);

      if (!state.enemy.isAlive) {
        setTimeout(() => {
          enemyImg.src =
            gifsGoblin.morte ?? gifsGoblin.damage ?? gifsGoblin.padrao;
        }, 250);
      } else {
        enemyImg.src = gifsGoblin.damage ?? gifsGoblin.padrao;
        setTimeout(() => {
          enemyImg.src = gifsGoblin.padrao;
        }, 500);
      }
    }
  }

  if (lastEvent.actorId === state.enemy.id) {
    enemyImg.src = gifsGoblin.atk ?? gifsGoblin.padrao;

    dashAttack(enemyImg, heroImg, 620, false);

    setTimeout(() => {
      enemyImg.src = gifsGoblin.padrao;
      heroImg.src = heroDamageGif;

      shakeTarget(heroWrapper, lastEvent.critical === true);
      spawnDamageNumber(
        heroWrapper,
        lastEvent.damage ?? 0,
        lastEvent.critical === true,
      );

      setTimeout(() => {
        heroImg.src = heroDefaultGif;
      }, 500);
    }, 320);
  }
}

function playHeroAttackSkillEffect(
  className: BattleState["hero"]["className"],
  skillGif: string,
  heroImg: HTMLImageElement,
  enemyImg: HTMLImageElement,
) {
  if (!className || !skillGif) return;

  if (className === "arqueiro") {
    spawnProjectileEffect(heroImg, enemyImg, skillGif, 700, 70, 70);
  }
}

function playHeroMagicSkillEffect(
  className: BattleState["hero"]["className"],
  skillGif: string,
  heroImg: HTMLImageElement,
  enemyImg: HTMLImageElement,
) {
  if (!className || !skillGif) return;

  if (className === "guerreiro") {
    spawnProjectileEffect(heroImg, enemyImg, skillGif, 550, 130, 130);
  }

  if (className === "mago") {
    spawnProjectileEffect(heroImg, enemyImg, skillGif, 650, 110, 110);
  }
}

function flashTarget(target: HTMLElement | null, critical: boolean) {
  if (!target) return;

  target.animate(
    [
      { filter: "brightness(1)", transform: "translateX(0px)" },
      {
        filter: critical ? "brightness(1.8)" : "brightness(1.3)",
        transform: critical ? "translateX(-8px)" : "translateX(-4px)",
      },
      { filter: "brightness(1)", transform: "translateX(0px)" },
    ],
    {
      duration: critical ? 450 : 250,
      easing: "ease-out",
    },
  );
}

function shakeTarget(target: HTMLElement | null, critical: boolean) {
  if (!target) return;

  target.animate(
    critical
      ? [
          { transform: "translateX(0px)" },
          { transform: "translateX(-12px)" },
          { transform: "translateX(12px)" },
          { transform: "translateX(-8px)" },
          { transform: "translateX(0px)" },
        ]
      : [
          { transform: "translateX(0px)" },
          { transform: "translateX(-6px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(0px)" },
        ],
    {
      duration: critical ? 350 : 220,
      easing: "ease-out",
    },
  );
}

function pulseDefend(target: HTMLElement | null) {
  if (!target) return;

  target.animate(
    [
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(1.04)", opacity: 0.85 },
      { transform: "scale(1)", opacity: 1 },
    ],
    {
      duration: 350,
      easing: "ease-out",
    },
  );
}

function spawnDamageNumber(
  target: HTMLElement | null,
  damage: number,
  critical: boolean,
) {
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const damageEl = document.createElement("div");

  damageEl.textContent = critical ? `-${damage}!` : `-${damage}`;
  damageEl.style.position = "fixed";
  damageEl.style.left = `${rect.left + rect.width / 2}px`;
  damageEl.style.top = `${rect.top + 20}px`;
  damageEl.style.zIndex = "9999";
  damageEl.style.fontWeight = "bold";
  damageEl.style.fontSize = critical ? "32px" : "24px";
  damageEl.style.color = critical ? "#ffcc00" : "#ff4d4f";
  damageEl.style.textShadow = "0 2px 8px rgba(0,0,0,0.6)";
  damageEl.style.pointerEvents = "none";

  document.body.appendChild(damageEl);

  damageEl.animate(
    [
      { transform: "translate(-50%, 0px)", opacity: 1 },
      { transform: "translate(-50%, -40px)", opacity: 1 },
      { transform: "translate(-50%, -70px)", opacity: 0 },
    ],
    {
      duration: critical ? 1100 : 850,
      easing: "ease-out",
    },
  );

  setTimeout(
    () => {
      damageEl.remove();
    },
    critical ? 1100 : 850,
  );
}

function spawnProjectileEffect(
  heroImg: HTMLImageElement,
  enemyImg: HTMLImageElement,
  skillGif: string,
  duration: number,
  width: number,
  height: number,
) {
  if (!skillGif) return;

  const heroRect = heroImg.getBoundingClientRect();
  const enemyRect = enemyImg.getBoundingClientRect();

  const projectile = document.createElement("img");
  projectile.src = skillGif;
  projectile.style.position = "fixed";
  projectile.style.left = `${heroRect.left + heroRect.width / 2}px`;
  projectile.style.top = `${heroRect.top + heroRect.height / 2}px`;
  projectile.style.width = `${width}px`;
  projectile.style.height = `${height}px`;
  projectile.style.transform = "translate(-50%, -50%)";
  projectile.style.zIndex = "10000";
  projectile.style.pointerEvents = "none";
  projectile.style.willChange = "transform, opacity";

  document.body.appendChild(projectile);

  const deltaX =
    enemyRect.left + enemyRect.width / 2 - (heroRect.left + heroRect.width / 2);
  const deltaY =
    enemyRect.top + enemyRect.height / 2 - (heroRect.top + heroRect.height / 2);

  const isSlash = skillGif.toLowerCase().includes("slash");

  const animation = projectile.animate(
    isSlash
      ? [
          {
            transform: "translate(-50%, -50%) scale(0.7) rotate(0deg)",
            opacity: 0.9,
          },
          {
            transform: `translate(calc(${deltaX * 0.5}px - 50%), calc(${deltaY * 0.5}px - 50%)) scale(1) rotate(180deg)`,
            opacity: 1,
          },
          {
            transform: `translate(calc(${deltaX}px - 50%), calc(${deltaY}px - 50%)) scale(1.15) rotate(360deg)`,
            opacity: 0,
          },
        ]
      : [
          { transform: "translate(-50%, -50%)", opacity: 1 },
          {
            transform: `translate(calc(${deltaX}px - 50%), calc(${deltaY}px - 50%))`,
            opacity: 0,
          },
        ],
    {
      duration,
      easing: "ease-out",
      fill: "forwards",
    },
  );

  animation.onfinish = () => {
    projectile.remove();
  };
}
function dashAttack(
  attackerImg: HTMLImageElement,
  targetImg: HTMLImageElement,
  duration: number,
  fromLeftToRight: boolean,
) {
  const attackerRect = attackerImg.getBoundingClientRect();
  const targetRect = targetImg.getBoundingClientRect();

  const attackerCenterX = attackerRect.left + attackerRect.width / 2;
  const attackerCenterY = attackerRect.top + attackerRect.height / 2;

  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  const fullDeltaX = targetCenterX - attackerCenterX;
  const fullDeltaY = targetCenterY - attackerCenterY;

  const stopShortX = fromLeftToRight ? fullDeltaX - 120 : fullDeltaX + 120;
  const stopShortY = fullDeltaY;

  attackerImg.animate(
    [
      { transform: "translate(0px, 0px)" },
      { transform: `translate(${stopShortX}px, ${stopShortY}px)` },
      { transform: "translate(0px, 0px)" },
    ],
    {
      duration,
      easing: "ease-in-out",
    },
  );
}
function handleBattleEndRedirect(state: BattleState) {
  if (!state.finished) return;
  if (state.winnerId !== state.hero.id) return;
  if (victoryRedirectScheduled) return;

  victoryRedirectScheduled = true;

  setTimeout(() => {
    window.location.href = "/pages/caminho-drakoria.html";
  }, 2500);
}
