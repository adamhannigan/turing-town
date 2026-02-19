/**
 * Generate HUD icons via Scenario API and save to public/assets/.
 * Run from repo root: npm run generate-hud-icons
 * Generates: icon-collect.png, icon-building.png, icon-reset.png
 * Requires: SCENARIO_API_KEY, SCENARIO_API_SECRET (e.g. in Copilot's "copilot" environment).
 */

import { requestImage, SCENARIO_MODEL_UI } from "../agents/skills/images.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, "..", "public", "assets");

async function downloadToFile(url: string, filePath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}

interface IconConfig {
  filename: string;
  prompt: string;
}

const icons: IconConfig[] = [
  {
    filename: "icon-collect.png",
    prompt: "gold coin icon, shiny metallic, game UI, flat design, 48x48 pixels, clean simple icon on transparent background",
  },
  {
    filename: "icon-building.png",
    prompt: "building construction icon, house or city building silhouette, game UI, flat design, 48x48 pixels, clean simple icon on transparent background",
  },
  {
    filename: "icon-reset.png",
    prompt: "reset or refresh icon, circular arrow, game UI, flat design, 48x48 pixels, clean simple icon on transparent background",
  },
];

async function main(): Promise<void> {
  const size = 48;

  for (const icon of icons) {
    const outPath = path.join(ASSETS_DIR, icon.filename);
    console.log(`Generating ${icon.filename} -> ${outPath} ...`);
    try {
      const result = await requestImage({
        prompt: icon.prompt,
        modelId: SCENARIO_MODEL_UI,
        width: size,
        height: size,
        aspectRatio: "1:1",
      });
      console.log(`  Generated URL: ${result.url}`);
      await downloadToFile(result.url, outPath);
      console.log(`  -> ${outPath}`);
    } catch (err) {
      console.error(`  Failed:`, err);
      process.exitCode = 1;
    }
  }
}

main();
