/**
 * Generate building (and optional UI) images via Scenario API and save to public/assets/.
 * Run from repo root: npm run generate-images [building-id ...]
 * If no IDs given, generates for all buildings in BUILDING_CATALOG.
 * Requires: SCENARIO_API_KEY, SCENARIO_API_SECRET (e.g. in Copilot's "copilot" environment).
 */

import { requestImage, SCENARIO_MODEL_GAME_ASSETS } from "../agents/skills/images.js";
import { BUILDING_CATALOG } from "../src/game/state.js";
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

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const requestedIds = args.length > 0 ? args : BUILDING_CATALOG.map((b) => b.id);
  const size = 56;

  for (const id of requestedIds) {
    const def = BUILDING_CATALOG.find((b) => b.id === id);
    const name = def?.name ?? id;
    const outPath = path.join(ASSETS_DIR, `${id}.png`);
    console.log(`Generating ${id} (${name}) -> ${outPath} ...`);
    try {
      const result = await requestImage({
        prompt: `isometric pixel art ${name.toLowerCase()} building, ${size}x${size}, game asset, clear silhouette, transparent background`,
        modelId: SCENARIO_MODEL_GAME_ASSETS,
        width: size,
        height: size,
        aspectRatio: "1:1",
      });
      await downloadToFile(result.url, outPath);
      console.log(`  -> ${outPath}`);
    } catch (err) {
      console.error(`  Failed:`, err);
      process.exitCode = 1;
    }
  }
}

main();
