/**
 * Thrown when application code invokes behavior belonging to a capability
 * whose configuration is absent.
 *
 * The message names the capability and points at its guide. It never contains
 * configuration values, so it is safe to log and safe to surface in a
 * developer-facing error boundary.
 */
export class CapabilityUnavailableError extends Error {
  readonly capability: string;
  readonly guide?: string;

  constructor(capability: string, guide?: string) {
    const guidance = guide
      ? ` See ${guide} for setup instructions.`
      : " See its capability guide for setup instructions.";

    super(
      `The "${capability}" capability is not configured, so this behavior is unavailable.${guidance}`,
    );

    this.name = "CapabilityUnavailableError";
    this.capability = capability;
    this.guide = guide;
  }
}

/**
 * Narrows a possibly-absent capability client to its available form, throwing
 * `CapabilityUnavailableError` when the capability is not configured.
 */
export function requireCapability<T>(
  capability: string,
  value: T | null | undefined,
  guide?: string,
): T {
  if (value === null || value === undefined) {
    throw new CapabilityUnavailableError(capability, guide);
  }
  return value;
}
