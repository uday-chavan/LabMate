/**
 * gemini-keys.ts
 *
 * Global Gemini API key manager with sequential fallback.
 *
 * - Reads up to 4 keys from environment variables (GEMINI_API_KEY_1 … _4).
 * - `callGemini()` tries keys in order; on a quota / rate-limit / auth error
 *   it automatically retries the same request with the next key.
 * - Each key tracks how many consecutive failures it has seen. A key that
 *   fails 3 times in a row is temporarily skipped for 60 seconds so it can
 *   recover, then re-enabled automatically.
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const COOLDOWN_MS = 60_000;          // 1 minute cooldown after 3 consecutive failures
const MAX_CONSECUTIVE_FAILS = 3;

interface KeyState {
  key: string;
  failures: number;
  cooledDownUntil: number;           // epoch ms; 0 = not in cooldown
}

// ─── Load keys once at module init ───────────────────────────────────────────
function loadKeys(): KeyState[] {
  const keys: KeyState[] = [];
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`]?.trim();
    if (k) keys.push({ key: k, failures: 0, cooledDownUntil: 0 });
  }
  // Legacy single-key fallback
  if (keys.length === 0) {
    const k = process.env.GEMINI_API_KEY?.trim();
    if (k) keys.push({ key: k, failures: 0, cooledDownUntil: 0 });
  }
  if (keys.length === 0) {
    console.warn("[gemini-keys] No Gemini API keys found in environment variables.");
  }
  return keys;
}

const keyStates: KeyState[] = loadKeys();

/** Returns keys that are not currently in cooldown, in order. */
function availableKeys(): KeyState[] {
  const now = Date.now();
  return keyStates.filter((s) => now >= s.cooledDownUntil);
}

/** Mark a key as having succeeded — resets its failure count. */
function markSuccess(state: KeyState) {
  state.failures = 0;
  state.cooledDownUntil = 0;
}

/** Mark a key as having failed. If it hits the threshold, put it in cooldown. */
function markFailure(state: KeyState, reason: string) {
  state.failures += 1;
  const keyHint = `...${state.key.slice(-6)}`;
  if (state.failures >= MAX_CONSECUTIVE_FAILS) {
    state.cooledDownUntil = Date.now() + COOLDOWN_MS;
    console.warn(
      `[gemini-keys] Key ${keyHint} placed in cooldown for ${COOLDOWN_MS / 1000}s after ${state.failures} failures. Reason: ${reason}`
    );
  } else {
    console.warn(`[gemini-keys] Key ${keyHint} failure #${state.failures}: ${reason}`);
  }
}

/** Returns true if the HTTP status indicates a key-level problem (quota / auth). */
function isKeyError(status: number): boolean {
  return status === 401 || status === 403 || status === 429 || status === 503;
}

export interface GeminiRequest {
  contents: object[];
  generationConfig?: object;
  safetySettings?: object[];
}

export interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }> };
  }>;
}

/**
 * Call the Gemini API with automatic key rotation on failure.
 *
 * @throws Error if all keys fail or no keys are configured.
 */
export async function callGemini(body: GeminiRequest): Promise<GeminiResponse> {
  const keys = availableKeys();

  if (keys.length === 0) {
    // All keys in cooldown — wait for the one that recovers soonest
    const soonest = keyStates.reduce((a, b) =>
      a.cooledDownUntil < b.cooledDownUntil ? a : b
    );
    const waitMs = soonest.cooledDownUntil - Date.now();
    throw new Error(
      `All Gemini API keys are temporarily rate-limited. Please wait ~${Math.ceil(waitMs / 1000)}s and try again.`
    );
  }

  let lastError = "";

  for (const state of keys) {
    const url = `${GEMINI_BASE}?key=${state.key}`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (networkErr: any) {
      lastError = `Network error: ${networkErr.message}`;
      markFailure(state, lastError);
      continue; // try next key
    }

    if (res.ok) {
      const data = await res.json() as GeminiResponse;
      markSuccess(state);
      return data;
    }

    const errText = await res.text().catch(() => res.statusText);
    lastError = `HTTP ${res.status}: ${errText.slice(0, 120)}`;

    if (isKeyError(res.status)) {
      markFailure(state, lastError);
      continue; // try next key
    }

    // Non-key error (e.g., 400 bad request) — don't blame the key, throw immediately
    throw new Error(`API error: ${lastError}`);
  }

  throw new Error(`All API key's limit exhausted.`);
}

/**
 * Convenience: call Gemini and extract the first text response.
 * Strips markdown bold markers (**) for clean output.
 */
export async function callGeminiText(body: GeminiRequest): Promise<string> {
  const data = await callGemini(body);
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) throw new Error("Gemini returned an empty response.");
  const text = parts.map((p: any) => p.text).join("");
  return text.replace(/\*\*/g, "").trim();
}

/** How many keys are currently active (not in cooldown). */
export function activeKeyCount(): number {
  return availableKeys().length;
}

/** Status snapshot for debugging / health check. */
export function keyStatus(): object[] {
  const now = Date.now();
  return keyStates.map((s, i) => ({
    slot: i + 1,
    suffix: `...${s.key.slice(-6)}`,
    failures: s.failures,
    cooledDown: now < s.cooledDownUntil,
    recoversInSec: now < s.cooledDownUntil ? Math.ceil((s.cooledDownUntil - now) / 1000) : 0,
  }));
}
