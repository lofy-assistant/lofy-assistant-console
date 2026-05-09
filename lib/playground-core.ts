/**
 * Core API base URL for staging (server-side proxy for playground/character debug tools).
 * In console env this should be `CORE_API_URL` pointing at **staging** core;
 * dashboards still use DATABASE_URL / MONGODB_URI (production).
 */
export function getPlaygroundCoreBaseUrl(): string {
  const raw =
    process.env.CORE_API_URL?.trim() ||
    process.env.FASTAPI_URL?.trim() ||
    process.env.PLAYGROUND_FASTAPI_URL?.trim() ||
    process.env.PLAYGROUND_CORE_BASE_URL?.trim() ||
    ""
  return raw.endsWith("/") ? raw.slice(0, -1) : raw
}

export function getPlaygroundAdminSecret(): string {
  return process.env.PLAYGROUND_ADMIN_SECRET?.trim() || ""
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
}
