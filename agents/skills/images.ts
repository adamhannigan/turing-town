/**
 * Scenario AI image generation skill.
 * Use when an agent task is to create an image (e.g. building sprite, icon).
 *
 * Model presets (use modelId in requestImage):
 *   - UI elements (buttons, icons, HUD art): SCENARIO_MODEL_UI
 *   - Game/Phaser assets (buildings, roads, tiles): SCENARIO_MODEL_GAME_ASSETS (isometric style)
 *
 * ENV (GitHub Actions: set as repository secrets; locally: .env or export):
 *   SCENARIO_API_KEY    – required
 *   SCENARIO_API_SECRET – required
 *   SCENARIO_MODEL_ID   – optional; fallback when modelId not passed
 */

const SCENARIO_BASE = "https://api.cloud.scenario.com/v1";

/** Use for UI elements: buttons, icons, HUD art. */
export const SCENARIO_MODEL_UI = "model_mcYj5uGzXteUw6tKapsaDgBP";

/** Use for game/Phaser assets: buildings, roads, tiles. Isometric style matching gameplay. */
export const SCENARIO_MODEL_GAME_ASSETS = "model_nB7x6dxqtxtmFDm8tdFdv9xP";
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 60; // ~2 min

export interface RequestImageOptions {
  /** Text prompt for the image */
  prompt: string;
  /** Model ID (default: process.env.SCENARIO_MODEL_ID) */
  modelId?: string;
  /** Aspect ratio, e.g. "1:1", "16:9" */
  aspectRatio?: string;
  /** Width in pixels (if supported by model) */
  width?: number;
  /** Height in pixels (if supported by model) */
  height?: number;
  /** Extra body fields for model-specific params (from GET /models/{id}) */
  extra?: Record<string, unknown>;
}

export interface RequestImageResult {
  url: string;
  assetId: string;
  jobId: string;
}

function getAuthHeader(): string {
  const key = process.env.SCENARIO_API_KEY;
  const secret = process.env.SCENARIO_API_SECRET;
  if (!key || !secret) {
    throw new Error(
      "Scenario API credentials missing. Set SCENARIO_API_KEY and SCENARIO_API_SECRET (e.g. GitHub repo secrets)."
    );
  }
  const encoded = Buffer.from(`${key}:${secret}`).toString("base64");
  return `Basic ${encoded}`;
}

async function pollJobUntilDone(jobId: string): Promise<{ assetIds: string[]; assets?: { assetId: string; url: string }[] }> {
  const auth = getAuthHeader();
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const res = await fetch(`${SCENARIO_BASE}/jobs/${jobId}`, {
      headers: { Authorization: auth },
    });
    if (!res.ok) {
      throw new Error(`Scenario jobs API error: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as {
      job?: {
        status: string;
        metadata?: { assetIds?: string[]; assets?: { assetId: string; url: string }[] };
      };
    };
    const job = data.job;
    if (!job) {
      throw new Error("Scenario API response missing job object");
    }
    if (job.status === "success") {
      const assetIds = job.metadata?.assetIds ?? [];
      const assets = job.metadata?.assets;
      if (assetIds.length === 0 && (!assets || assets.length === 0)) {
        throw new Error("Scenario job succeeded but no assets returned.");
      }
      return {
        assetIds,
        assets: job.metadata?.assets,
      };
    }
    if (job.status === "failed" || job.status === "canceled") {
      throw new Error(`Scenario job ended with status: ${job.status}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("Scenario job polling timed out.");
}

/**
 * Request a single image from Scenario AI (public or custom model).
 * Uses SCENARIO_API_KEY, SCENARIO_API_SECRET, and optionally SCENARIO_MODEL_ID from env.
 */
export async function requestImage(options: RequestImageOptions): Promise<RequestImageResult> {
  const modelId = options.modelId ?? process.env.SCENARIO_MODEL_ID;
  if (!modelId) {
    throw new Error(
      "No model ID. Set SCENARIO_MODEL_ID in env or pass options.modelId (e.g. from Scenario dashboard)."
    );
  }

  // Build parameters for the inference request
  // Note: width/height constraints: must be between 128-2048 and multiples of 8, or omit for defaults
  const parameters: Record<string, unknown> = {
    type: "txt2img",
    prompt: options.prompt,
    numSamples: 1,
    ...options.extra,
  };
  
  // Only include width/height if they meet API requirements (128-2048, multiple of 8)
  if (options.width != null && options.width >= 128 && options.width <= 2048 && options.width % 8 === 0) {
    parameters.width = options.width;
  }
  if (options.height != null && options.height >= 128 && options.height <= 2048 && options.height % 8 === 0) {
    parameters.height = options.height;
  }

  const body = { parameters };

  const res = await fetch(`${SCENARIO_BASE}/models/${modelId}/inferences`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Scenario generate API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { job?: { jobId: string } };
  const jobId = data.job?.jobId;
  if (!jobId) {
    throw new Error("Scenario API did not return a job ID.");
  }

  const { assetIds, assets } = await pollJobUntilDone(jobId);
  const firstAssetId = assetIds[0] ?? assets?.[0]?.assetId;
  const firstUrl = assets?.[0]?.url;

  if (!firstAssetId) {
    throw new Error("Scenario job produced no asset ID.");
  }

  // If job response doesn't include URL, fetch asset by ID
  let url = firstUrl;
  if (!url) {
    try {
      const assetRes = await fetch(`${SCENARIO_BASE}/assets/${firstAssetId}`, {
        headers: { Authorization: getAuthHeader() },
      });
      if (assetRes.ok) {
        const assetData = (await assetRes.json()) as { asset?: { url?: string } };
        url = assetData.asset?.url;
      }
    } catch {
      // ignore
    }
  }

  return {
    url: url ?? `https://api.cloud.scenario.com/v1/assets/${firstAssetId}`,
    assetId: firstAssetId,
    jobId,
  };
}
