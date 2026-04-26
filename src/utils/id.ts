/**
 * Stable id generator. Uses crypto.randomUUID when available
 * (modern browsers, Node 19+, Tauri 2 webview), falls back to a
 * timestamp+random hex for older runtimes.
 */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rnd}`;
}
