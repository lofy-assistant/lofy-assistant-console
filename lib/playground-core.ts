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

export function getFetchFailureDetails(error: unknown): string | null {
  if (!(error instanceof TypeError) || error.message !== "fetch failed") {
    return null
  }

  const code = getNetworkErrorCode((error as TypeError & { cause?: unknown }).cause)

  if (code === "ECONNREFUSED") {
    return "Core API is not accepting connections. Start lofy-assistant-core or update CORE_API_URL."
  }

  if (code === "ECONNRESET") {
    return "Core API closed the connection before responding. Check the core server logs for the failed request."
  }

  return "Core API request failed before a response was received."
}

function getNetworkErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null
  }

  if ("code" in error && typeof (error as { code?: unknown }).code === "string") {
    return (error as { code: string }).code
  }

  if (error instanceof AggregateError) {
    for (const child of error.errors) {
      const code = getNetworkErrorCode(child)
      if (code) {
        return code
      }
    }
  }

  if ("cause" in error) {
    return getNetworkErrorCode((error as { cause?: unknown }).cause)
  }

  return null
}
