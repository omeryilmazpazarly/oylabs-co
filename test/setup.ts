import { randomBytes } from 'crypto';

process.env.TOKEN_ENCRYPTION_KEY ??= randomBytes(32).toString('base64');
process.env.META_APP_ID ??= '1234567890';
process.env.META_APP_SECRET ??= 'test-app-secret';
process.env.META_VERIFY_TOKEN ??= 'test-verify-token';
process.env.META_LOGIN_CONFIG_ID ??= '987654321';
process.env.APP_BASE_URL ??= 'https://oylabs.test';
process.env.MESSAGING_DB_PATH = ':memory:';

// Structured logs are noise in test output; assertions don't depend on them.
import { vi } from 'vitest';
vi.spyOn(console, 'log').mockImplementation(() => undefined);
vi.spyOn(console, 'warn').mockImplementation(() => undefined);
vi.spyOn(console, 'error').mockImplementation(() => undefined);
