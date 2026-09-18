#!/usr/bin/env node

/**
 * Drakoria Sprite Generator
 * -------------------------------------------------------------
 * Le um spritesheet PNG e gera GIFs de animacao no padrao do Drakoria.
 *
 * 1) Atalho (layout padrao 6 linhas x N frames):
 *    node sprite-generator.js -i goblin.png -o ../../img/monstros -n goblin \
 *      --frame-width 128 --frame-height 128 --frames 6 --delay 120
 *
 * 2) Config JSON (qualquer layout de spritesheet):
 *    node sprite-generator.js --config sprite-config.json
 */

const fs = require("node:fs");
const path = require("node:path");
const { Command } = require("commander");
const sharp = require("sharp");
const GIFEncoder = require("gif-encoder-2");

const program = new Command();

const DEFAULT_ACTIONS = [
  "padrao",
  "ataque",
  "defesa",
  "magia",
  "dano",
  "morte",
];

program
  .name("drakoria-sprite-generator")
  .description(
    "Gera GIFs de animacao para o Drakoria a partir de spritesheets.",
  )
  .option("-c, --config <file>", "Arquivo JSON de configuracao do spritesheet")
  .option("-i, --input <file>", "Caminho do spritesheet PNG (modo atalho)")
  .option("-o, --output <folder>", "Pasta de saida dos GIFs (modo atalho)")
  .option("-n, --name <name>", "Nome base do personagem/monstro (modo atalho)")
  .option(
    "--frame-width <number>",
    "Largura de cada frame (modo atalho)",
    parseInt,
  )
  .option(
    "--frame-height <number>",
    "Altura de cada frame (modo atalho)",
    parseInt,
  )
  .option("--frames <number>", "Frames por animacao (modo atalho)", parseInt, 6)
  .option("--delay <number>", "Delay entre frames em ms", parseInt, 100)
  .option("--scale <number>", "Escala de saida", parseFloat, 1)
  .option("--no-manifest", "Nao gerar o manifest JSON")
  .parse(process.argv);

const options = program.opts();

async function main() {
  if (options.config) {
    await runFromConfig(path.resolve(options.config));
    return;
  }

  if (!options.input || !options.output || !options.name) {
    throw new Error(
      "Modo atalho exige --input, --output e --name. Ou use --config.",
    );
  }

  if (!options.frameWidth || !options.frameHeight) {
    throw new Error("Modo atalho exige --frame-width e --frame-height.");
  }

  const actions = DEFAULT_ACTIONS.map((key, index) => ({
    key,
    row: index,
    frames: options.frames,
    delay: options.delay,
  }));

  const config = {
    input: path.resolve(options.input),
    output: path.resolve(options.output),
    name: options.name,
    frameWidth: options.frameWidth,
    frameHeight: options.frameHeight,
    scale: options.scale,
    actions,
  };

  const result = await generateFromConfig(config, options.noManifest !== false);
  printSummary(result);
}

async function runFromConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config nao encontrado: ${configPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const baseDir = path.dirname(configPath);

  const config = normalizeConfig(raw, baseDir);
  const result = await generateFromConfig(config, options.noManifest !== false);
  printSummary(result);
}

function normalizeConfig(raw, baseDir) {
  const input = raw.input ? path.resolve(baseDir, raw.input) : null;
  const output = raw.output ? path.resolve(baseDir, raw.output) : null;

  if (!input || !output)
    throw new Error("Config precisa de 'input' e 'output'.");
  if (!raw.name) throw new Error("Config precisa de 'name'.");
  if (!raw.frameWidth || !raw.frameHeight) {
    throw new Error("Config precisa de 'frameWidth' e 'frameHeight'.");
  }

  const actionsRaw = raw.actions;
  let actions = [];

  if (Array.isArray(actionsRaw)) {
    actions = actionsRaw;
  } else if (actionsRaw && typeof actionsRaw === "object") {
    actions = Object.entries(actionsRaw).map(([key, value]) => ({
      key,
      ...value,
    }));
  } else {
    throw new Error("Config precisa de 'actions' (objeto ou array).");
  }

  actions = actions.map((action) => ({
    key: action.key,
    row: action.row ?? 0,
    col: action.col ?? raw.colStart ?? 0,
    frames: action.frames ?? 1,
    delay: action.delay ?? raw.delay ?? 100,
    suffix: action.suffix ?? defaultSuffix(action.key),
  }));

  return {
    input,
    output,
    name: raw.name,
    frameWidth: raw.frameWidth,
    frameHeight: raw.frameHeight,
    scale: raw.scale ?? 1,
    offsetX: raw.offsetX ?? 0,
    offsetY: raw.offsetY ?? 0,
    gapX: raw.gapX ?? 0,
    gapY: raw.gapY ?? 0,
    actions,
  };
}

function defaultSuffix(key) {
  return key === "padrao" || key === "idle" ? "" : `-${key}`;
}

async function generateFromConfig(config, writeManifest) {
  if (!fs.existsSync(config.input)) {
    throw new Error(`Spritesheet nao encontrado: ${config.input}`);
  }

  fs.mkdirSync(config.output, { recursive: true });

  const metadata = await sharp(config.input).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Nao foi possivel ler as dimensoes do spritesheet.");
  }

  validateSheet(config, metadata);

  const name = sanitizeName(config.name);
  const generated = {};

  for (const action of config.actions) {
    const outputFile = path.join(config.output, `${name}${action.suffix}.gif`);
    await generateGif(config, action, outputFile);
    generated[action.key] = outputFile;
    console.log(`Gerado: ${outputFile}`);
  }

  let manifestPath = null;

  if (writeManifest) {
    manifestPath = path.join(config.output, `${name}.manifest.json`);
    const manifest = createManifest(config, generated);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    console.log(`Manifest gerado: ${manifestPath}`);
  }

  return { name, generated, manifestPath, output: config.output };
}

function validateSheet(config, metadata) {
  let maxRight = 0;
  let maxBottom = 0;

  for (const action of config.actions) {
    const right =
      config.offsetX +
      (action.col + action.frames - 1) * (config.frameWidth + config.gapX) +
      config.frameWidth;

    const bottom =
      config.offsetY +
      action.row * (config.frameHeight + config.gapY) +
      config.frameHeight;

    maxRight = Math.max(maxRight, right);
    maxBottom = Math.max(maxBottom, bottom);
  }

  if (metadata.width < maxRight) {
    throw new Error(
      `Spritesheet muito estreito. Necessario >= ${maxRight}px, atual ${metadata.width}px.`,
    );
  }

  if (metadata.height < maxBottom) {
    throw new Error(
      `Spritesheet muito baixo. Necessario >= ${maxBottom}px, atual ${metadata.height}px.`,
    );
  }
}

async function generateGif(config, action, outputFile) {
  const outputWidth = Math.max(1, Math.floor(config.frameWidth * config.scale));
  const outputHeight = Math.max(
    1,
    Math.floor(config.frameHeight * config.scale),
  );

  const encoder = new GIFEncoder(outputWidth, outputHeight);
  encoder.setDelay(action.delay);
  encoder.setRepeat(0);
  encoder.setQuality(10);
  encoder.start();

  for (let i = 0; i < action.frames; i++) {
    const left =
      config.offsetX + (action.col + i) * (config.frameWidth + config.gapX);
    const top =
      config.offsetY + action.row * (config.frameHeight + config.gapY);

    let pipeline = sharp(config.input).extract({
      left,
      top,
      width: config.frameWidth,
      height: config.frameHeight,
    });

    if (config.scale !== 1) {
      pipeline = pipeline.resize(outputWidth, outputHeight, {
        kernel: "nearest",
        fit: "fill",
      });
    }

    const rawFrame = await pipeline.ensureAlpha().raw().toBuffer();
    encoder.addFrame(rawFrame);
  }

  encoder.finish();
  fs.writeFileSync(outputFile, encoder.out.getData());
}

function createManifest(config, generated) {
  const actions = {};

  for (const [key, filePath] of Object.entries(generated)) {
    actions[key] = toPublicPath(filePath);
  }

  return {
    name: sanitizeName(config.name),
    frameWidth: config.frameWidth,
    frameHeight: config.frameHeight,
    scale: config.scale,
    actions,
  };
}

function toPublicPath(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  const marker = "/img/";
  const index = normalized.indexOf(marker);

  return index >= 0 ? normalized.slice(index) : normalized;
}

function sanitizeName(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function printSummary({ name, generated, output }) {
  console.log("");
  console.log("Concluido.");
  console.log(`  Nome:   ${name}`);
  console.log(`  Saida:  ${output}`);
  console.log(`  Acoes:  ${Object.keys(generated).length}`);
}

main().catch((error) => {
  console.error("Erro:", error.message);
  process.exit(1);
});
