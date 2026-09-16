#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { Command } = require("commander");
const sharp = require("sharp");
const GIFEncoder = require("gif-encoder-2");

const program = new Command();

const ACTIONS = [
  { key: "padrao", suffix: "", row: 0 },
  { key: "ataque", suffix: "-ataque", row: 1 },
  { key: "defesa", suffix: "-defesa", row: 2 },
  { key: "magia", suffix: "-magia", row: 3 },
  { key: "dano", suffix: "-dano", row: 4 },
  { key: "morte", suffix: "-morte", row: 5 },
];

program
  .name("drakoria-sprite-generator")
  .description(
    "Gera GIFs de animacao para o Drakoria a partir de spritesheets.",
  )
  .requiredOption("-i, --input <file>", "Caminho do spritesheet PNG")
  .requiredOption("-o, --output <folder>", "Pasta de saida dos GIFs")
  .requiredOption("-n, --name <name>", "Nome base do personagem ou monstro")
  .requiredOption("--frame-width <number>", "Largura de cada frame", parseInt)
  .requiredOption("--frame-height <number>", "Altura de cada frame", parseInt)
  .option("--frames <number>", "Quantidade de frames por animacao", parseInt, 6)
  .option("--delay <number>", "Delay entre frames em ms", parseInt, 100)
  .option("--scale <number>", "Escala de saida", parseFloat, 1)
  .option("--manifest", "Gerar manifest JSON", true)
  .parse(process.argv);

const options = program.opts();

async function main() {
  const inputPath = path.resolve(options.input);
  const outputFolder = path.resolve(options.output);
  const name = sanitizeName(options.name);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Spritesheet nao encontrado: ${inputPath}`);
  }

  fs.mkdirSync(outputFolder, { recursive: true });

  const metadata = await sharp(inputPath).metadata();

  validateSheet(
    metadata,
    options.frameWidth,
    options.frameHeight,
    options.frames,
  );

  const generated = {};

  for (const action of ACTIONS) {
    const outputFile = path.join(outputFolder, `${name}${action.suffix}.gif`);

    await generateGif({
      inputPath,
      outputFile,
      row: action.row,
      frameWidth: options.frameWidth,
      frameHeight: options.frameHeight,
      frames: options.frames,
      delay: options.delay,
      scale: options.scale,
    });

    generated[action.key] = outputFile;
    console.log(`Gerado: ${outputFile}`);
  }

  if (options.manifest) {
    const manifestPath = path.join(outputFolder, `${name}.manifest.json`);
    const manifest = createManifest(name, generated);

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    console.log(`Manifest gerado: ${manifestPath}`);
  }

  console.log("Concluido.");
}

function validateSheet(metadata, frameWidth, frameHeight, frames) {
  const requiredWidth = frameWidth * frames;
  const requiredHeight = frameHeight * ACTIONS.length;

  if (!metadata.width || !metadata.height) {
    throw new Error("Nao foi possivel ler dimensoes do spritesheet.");
  }

  if (metadata.width < requiredWidth) {
    throw new Error(
      `Spritesheet muito estreito. Necessario: ${requiredWidth}px, atual: ${metadata.width}px.`,
    );
  }

  if (metadata.height < requiredHeight) {
    throw new Error(
      `Spritesheet muito baixo. Necessario: ${requiredHeight}px, atual: ${metadata.height}px.`,
    );
  }
}

async function generateGif({
  inputPath,
  outputFile,
  row,
  frameWidth,
  frameHeight,
  frames,
  delay,
  scale,
}) {
  const outputWidth = Math.floor(frameWidth * scale);
  const outputHeight = Math.floor(frameHeight * scale);

  const encoder = new GIFEncoder(outputWidth, outputHeight);
  encoder.setDelay(delay);
  encoder.setRepeat(0);
  encoder.start();

  for (let col = 0; col < frames; col++) {
    const rawFrame = await sharp(inputPath)
      .extract({
        left: col * frameWidth,
        top: row * frameHeight,
        width: frameWidth,
        height: frameHeight,
      })
      .resize(outputWidth, outputHeight, {
        kernel: "nearest",
      })
      .ensureAlpha()
      .raw()
      .toBuffer();

    encoder.addFrame(rawFrame);
  }

  encoder.finish();

  fs.writeFileSync(outputFile, encoder.out.getData());
}

function createManifest(name, generated) {
  return {
    name,
    actions: {
      padrao: toPublicPath(generated.padrao),
      ataque: toPublicPath(generated.ataque),
      defesa: toPublicPath(generated.defesa),
      magia: toPublicPath(generated.magia),
      dano: toPublicPath(generated.dano),
      morte: toPublicPath(generated.morte),
    },
  };
}

function toPublicPath(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  const marker = "/img/";

  const index = normalized.indexOf(marker);

  if (index >= 0) {
    return normalized.slice(index);
  }

  return normalized;
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

main().catch((error) => {
  console.error("Erro:", error.message);
  process.exit(1);
});
