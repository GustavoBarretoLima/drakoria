import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

// Fail on HTML parsing, including during intermediate typewriter frames.
class NodeStub {
  children: NodeStub[] = [];
  className = "";
  style: Record<string, string> = {};
  listeners = new Map<string, () => void>();
  private text = "";
  constructor(readonly tag: string) {}
  set innerHTML(_value: string) { throw new Error("Intro must not parse HTML"); }
  get textContent(): string { return this.text + this.children.map(node => node.textContent).join(""); }
  set textContent(value: string) { this.text = value; this.children = []; }
  replaceChildren() { this.text = ""; this.children = []; }
  appendChild(node: NodeStub) { this.children.push(node); return node; }
  addEventListener(event: string, callback: () => void) { this.listeners.set(event, callback); }
}

function setup(values: Record<string, string> = {}) {
  const saved = new Map(Object.entries(values));
  const elements = new Map(["introTexto", "goblinCena", "falaGoblin", "continuar", "pularDialogos"].map(id => [id, new NodeStub("div")]));
  const timers = new Map<number, () => void>();
  let timerId = 0;
  let onLoad = () => {};
  let plays = 0;
  let pauses = 0;
  const audio = { currentTime: 12, play: () => { plays++; return Promise.resolve(); }, pause: () => { pauses++; } };
  const window = {
    location: { href: "" },
    addEventListener: (_event: string, callback: () => void) => { onLoad = callback; },
    setTimeout: (callback: () => void) => { timers.set(++timerId, callback); return timerId; },
  };
  const context = vm.createContext({
    window,
    clearTimeout: (id: number) => timers.delete(id),
    localStorage: {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
      removeItem: (key: string) => saved.delete(key),
    },
    document: {
      getElementById: (id: string) => id === "somGoblin" ? audio : elements.get(id),
      createTextNode: (text: string) => { const node = new NodeStub("#text"); node.textContent = text; return node; },
      createElement: (tag: string) => new NodeStub(tag),
    },
  });
  vm.runInContext(readFileSync("js/intro.js", "utf8"), context);
  onLoad();
  function tick() {
    const next = timers.entries().next().value;
    if (!next) return false;
    timers.delete(next[0]);
    next[1]();
    return true;
  }
  function finish() {
    let ticks = 0;
    while (tick()) assert.ok(++ticks < 5000, "Animation must finish");
  }
  return { elements, timers, saved, window, audio, tick, finish, get plays() { return plays; }, get pauses() { return pauses; } };
}

test("intro renders hostile name and class literally throughout typing, preserving name highlight", () => {
  const name = '</span><img src=x onerror="alert(1)"><script>alert(2)</script>& Ária';
  const heroClass = '<svg onload="alert(3)">Mago & Guerreiro</svg>';
  const scene = setup({ nomeHeroi: name, classeHeroi: heroClass });
  const intro = scene.elements.get("introTexto")!;
  assert.equal(intro.textContent, "\n");
  assert.equal(scene.plays, 0);
  assert.equal(scene.elements.get("goblinCena")!.style.display, undefined);
  let ticks = 0;
  while (scene.tick()) {
    assert.ok(++ticks < 5000, "Animation must finish");
    assert.deepEqual(intro.children.map(node => node.tag), ["#text", "span", "#text"]);
    assert.equal(intro.children[1]!.className, "nome-destaque");
    assert.deepEqual(intro.children[1]!.children.map(node => node.tag), ["#text"]);
    assert.ok(name.startsWith(intro.children[1]!.textContent));
  }
  assert.equal(intro.children[1]!.textContent, name);
  assert.ok(intro.textContent.includes(`, o(a) ${heroClass}, caminha`));
  assert.ok(intro.textContent.endsWith("Um Goblin faminto bloqueia sua passagem!\n  "));
  assert.equal(scene.plays, 1);
  assert.equal(scene.audio.currentTime, 0);
  assert.equal(scene.elements.get("goblinCena")!.style.display, "block");
  assert.equal(scene.elements.get("falaGoblin")!.textContent, "“Haaaaaaa! Carne fresca! Você não passará, herói!”");
  assert.equal(scene.elements.get("continuar")!.style.display, "inline-block");
  scene.elements.get("continuar")!.listeners.get("click")!();
  assert.equal(scene.window.location.href, "batalha.html");
});

test("intro keeps defaults, legacy class fallback and normal names with special characters", () => {
  const defaults = setup();
  defaults.finish();
  assert.equal(defaults.elements.get("introTexto")!.children[1]!.textContent, "Herói");
  assert.ok(defaults.elements.get("introTexto")!.textContent.includes("o(a) Classe,"));
  const legacy = setup({ nomeHeroi: 'Ária & <Luz> "D\'Água"', classeHeroiTexto: "Maga" });
  legacy.finish();
  assert.equal(legacy.elements.get("introTexto")!.children[1]!.textContent, 'Ária & <Luz> "D\'Água"');
  assert.ok(legacy.elements.get("introTexto")!.textContent.includes("o(a) Maga,"));
});

test("skip cancels typing and delayed goblin dialogue before entering battle", () => {
  for (const duringGoblin of [false, true]) {
    const scene = setup();
    if (duringGoblin) while (!scene.plays) assert.ok(scene.tick());
    scene.elements.get("pularDialogos")!.listeners.get("click")!();
    assert.equal(scene.timers.size, 0);
    assert.equal(scene.pauses, 1);
    assert.equal(scene.audio.currentTime, 0);
    assert.equal(scene.window.location.href, "batalha.html");
    assert.equal(scene.saved.get("tipoBatalhaAtual"), "intro-goblin");
    assert.equal(scene.elements.get("falaGoblin")!.textContent, "");
  }
});
