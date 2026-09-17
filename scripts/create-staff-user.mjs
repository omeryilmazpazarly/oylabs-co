#!/usr/bin/env node
/**
 * Create or reset an OY Labs console account.
 *
 *   node scripts/create-staff-user.mjs --email you@oylabs.co --name "Your Name"
 *
 * Prompts for the password without echoing it (or reads STAFF_PASSWORD). Run
 * from the app directory; the app must have started once so data/messaging.db
 * exists (set MESSAGING_DB_PATH to override). The hash format must match
 * src/lib/auth/password.ts.
 */
import { randomBytes, scryptSync } from 'crypto';
import { createInterface } from 'readline';
import { Writable } from 'stream';
import Database from 'better-sqlite3';
import fs from 'fs';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];

if (!args.email || !args.name) {
  console.error('Usage: node scripts/create-staff-user.mjs --email you@oylabs.co --name "Your Name"');
  process.exit(1);
}

const dbPath = process.env.MESSAGING_DB_PATH || 'data/messaging.db';
if (!fs.existsSync(dbPath)) {
  console.error(`${dbPath} not found. Start the app once so it creates the database, then re-run.`);
  process.exit(1);
}

async function askHidden(prompt) {
  process.stdout.write(prompt);
  const muted = new Writable({ write: (_chunk, _enc, done) => done() });
  const rl = createInterface({ input: process.stdin, output: muted, terminal: true });
  const answer = await new Promise((resolve) => rl.question('', resolve));
  rl.close();
  process.stdout.write('\n');
  return answer;
}

const password = process.env.STAFF_PASSWORD || await askHidden('Password (min 12 characters): ');
if (password.length < 12) {
  console.error('Password must be at least 12 characters.');
  process.exit(1);
}

const N = 16384, r = 8, p = 1;
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N, r, p });
const stored = ['scrypt', N, r, p, salt.toString('base64url'), hash.toString('base64url')].join('$');
const email = args.email.trim().toLowerCase();

const db = new Database(dbPath);
db.prepare(`
  INSERT INTO staff_users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)
  ON CONFLICT(email) DO UPDATE SET name = excluded.name, password_hash = excluded.password_hash
`).run(email, args.name.trim(), stored, Date.now());
db.prepare('DELETE FROM staff_sessions WHERE user_id = (SELECT id FROM staff_users WHERE email = ?)').run(email);
console.log(`Saved console account for ${email}. Any existing sessions for it were signed out.`);
