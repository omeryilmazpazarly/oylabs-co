import 'server-only';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomToken } from '@/lib/messaging/crypto';
import { AppError } from './apps';

/**
 * Logo and banner images for the mobile apps. Saved into public/uploads (in production
 * a symlink to /var/www/oylabs/public/uploads, kept across deploys) with flat,
 * unguessable names, and served from /uploads/<name>.
 */

const TYPES: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MAX_BYTES = 5 * 1024 * 1024;

export async function saveAppImage(appId: number, file: File): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new AppError('Upload a JPG, PNG or WebP image.');
  if (file.size > MAX_BYTES) throw new AppError('Images can be up to 5 MB.');
  const bytes = Buffer.from(await file.arrayBuffer());
  // Trust the bytes, not the browser's label.
  const magic = bytes.subarray(0, 12);
  const ok =
    (ext === '.jpg' && magic[0] === 0xff && magic[1] === 0xd8) ||
    (ext === '.png' && magic.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
    (ext === '.webp' && magic.subarray(0, 4).toString() === 'RIFF' && magic.subarray(8, 12).toString() === 'WEBP');
  if (!ok) throw new AppError('That file is not a valid image.');
  const dir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const name = `app-${appId}-${randomToken(9)}${ext}`;
  await writeFile(path.join(dir, name), bytes);
  return `/uploads/${name}`;
}
