/**
 * Thrown when application code invokes behavior belonging to an integration
 * whose configuration is absent.
 *
 * The message names the integration and points at its guide. It never contains
 * configuration values, so it is safe to log and safe to surface in a
 * developer-facing error boundary.
 */
export class IntegrationUnavailableError extends Error {
  readonly integration: string;
  readonly guide?: string;

  constructor(integration: string, guide?: string) {
    const guidance = guide
      ? ` See ${guide} for setup instructions.`
      : " See its integration guide for setup instructions.";

    super(
      `The "${integration}" integration is not configured, so this behavior is unavailable.${guidance}`,
    );

    this.name = "IntegrationUnavailableError";
    this.integration = integration;
    this.guide = guide;
  }
}

/**
 * Narrows a possibly-absent integration client to its available form, throwing
 * `IntegrationUnavailableError` when the integration is not configured.
 */
export function requireIntegration<T>(
  integration: string,
  value: T | null | undefined,
  guide?: string,
): T {
  if (value === null || value === undefined) {
    throw new IntegrationUnavailableError(integration, guide);
  }
  return value;
}
