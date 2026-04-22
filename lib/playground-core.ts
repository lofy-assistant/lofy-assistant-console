/**
 * FastAPI base URL for the AI playground (server-side proxy to core).
 * In console Vercel env this is typically `FASTAPI_URL` pointing at **staging** core;
 * dashboards still use DATABASE_URL / MONGODB_URI (production).
 */
export function getPlaygroundCoreBaseUrl(): string {
  const raw =
    process.env.FASTAPI_URL?.trim() ||
    process.env.PLAYGROUND_FASTAPI_URL?.trim() ||
    process.env.PLAYGROUND_CORE_BASE_URL?.trim() ||
    ""
  return raw.endsWith("/") ? raw.slice(0, -1) : raw
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
}
