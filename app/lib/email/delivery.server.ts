/**
 * Core's transactional email seam.
 *
 * Rocket ships no email transport: transactional email is a deferred backlog
 * integration. Core flows that would otherwise depend on one — password reset
 * above all — route through this seam so they degrade predictably instead of
 * failing silently.
 *
 * Behavior with no transport configured:
 *
 * - **development / test** — the message is written to the server console so
 *   the flow is fully exercisable locally.
 * - **production** — delivery refuses loudly. A reset link must never be
 *   printed to a production log, and a flow that silently drops mail is worse
 *   than one that is plainly unavailable.
 *
 * To make it real, implement `EmailTransport` against your provider and pass it
 * to `setEmailTransport` during server start-up.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailTransport {
  name: string;
  send(message: EmailMessage): Promise<void>;
}

export class EmailDeliveryUnavailableError extends Error {
  constructor() {
    super(
      "No email transport is configured, so this message cannot be delivered. " +
        "Transactional email is a deferred Rocket integration: implement EmailTransport and call " +
        "setEmailTransport() during server start-up. See docs/integrations/email.md.",
    );
    this.name = "EmailDeliveryUnavailableError";
  }
}

let transport: EmailTransport | null = null;

export function setEmailTransport(next: EmailTransport | null): void {
  transport = next;
}

/** Side-effect-free availability check. */
export function isEmailDeliveryAvailable(): boolean {
  return transport !== null;
}

export interface SendEmailOptions {
  /**
   * When true, the message body carries a credential-bearing link and must
   * never be written to a log outside development.
   */
  sensitive?: boolean;
  nodeEnv?: string;
}

export async function sendEmail(
  message: EmailMessage,
  options: SendEmailOptions = {},
): Promise<void> {
  if (transport) {
    await transport.send(message);
    return;
  }

  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV ?? "development";

  if (nodeEnv === "production") {
    throw new EmailDeliveryUnavailableError();
  }

  // Development fallback: the whole point is to surface the link locally.
  console.warn(
    [
      "",
      "──────────────────────────────────────────────────────────────",
      " No email transport configured — message written to the console",
      ` To:      ${message.to}`,
      ` Subject: ${message.subject}`,
      "",
      message.text,
      "──────────────────────────────────────────────────────────────",
      "",
    ].join("\n"),
  );
}
