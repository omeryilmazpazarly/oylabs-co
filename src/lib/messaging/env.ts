import 'server-only';

/**
 * Typed access to the messaging system's configuration.
 *
 * Values are read lazily (not at import time) so pages that don't need Meta
 * still render when the Meta env vars are missing, and tests can set
 * process.env before calling in.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new MissingConfigError(name);
  return value;
}

export class MissingConfigError extends Error {
  constructor(public readonly variable: string) {
    super(`Missing required environment variable ${variable}`);
    this.name = 'MissingConfigError';
  }
}

export const env = {
  metaAppId:        () => required('META_APP_ID'),
  metaAppSecret:    () => required('META_APP_SECRET'),
  metaVerifyToken:  () => required('META_VERIFY_TOKEN'),
  metaLoginConfigId: () => required('META_LOGIN_CONFIG_ID'),
  /** Facebook Login for Business configuration used by WhatsApp Embedded Signup. */
  metaWhatsAppConfigId: () => required('META_WA_CONFIG_ID'),
  metaGraphVersion: () => process.env.META_GRAPH_VERSION || 'v26.0',
  /** Set to "true" only after Meta approves the Human Agent feature for the app. */
  humanAgentApproved: () => process.env.META_HUMAN_AGENT_APPROVED === 'true',
  tokenEncryptionKey: () => required('TOKEN_ENCRYPTION_KEY'),
  appBaseUrl:       () => (process.env.APP_BASE_URL || 'https://oylabs.co').replace(/\/+$/, ''),
  messagingDbPath:  () => process.env.MESSAGING_DB_PATH || 'data/messaging.db',
  messageRetentionDays: () => Number(process.env.MESSAGE_RETENTION_DAYS || 90),
};

/** True when every variable the Meta integration needs at runtime is present. */
export function metaConfigured(): boolean {
  return ['META_APP_ID', 'META_APP_SECRET', 'META_VERIFY_TOKEN', 'META_LOGIN_CONFIG_ID', 'TOKEN_ENCRYPTION_KEY']
    .every((name) => Boolean(process.env[name]));
}

/** WhatsApp Embedded Signup needs its own Login configuration on top of the base Meta settings. */
export function whatsappConfigured(): boolean {
  return metaConfigured() && Boolean(process.env.META_WA_CONFIG_ID);
}
