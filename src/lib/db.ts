import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { PortfolioItem, PortfolioItemInput } from '@/types/portfolio';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'portfolio.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio_items (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      title            TEXT    NOT NULL,
      description      TEXT    NOT NULL,
      long_description TEXT    NOT NULL,
      main_category    TEXT    NOT NULL,
      tags             TEXT    NOT NULL DEFAULT '[]',
      item_order       INTEGER NOT NULL DEFAULT 0,
      cover_image      TEXT,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  /* Live-safe migrations — SQLite silently errors on duplicate ADD COLUMN,
     so we try each individually and swallow the exception. */
  const migrations = [
    `ALTER TABLE portfolio_items ADD COLUMN website_url  TEXT`,
    `ALTER TABLE portfolio_items ADD COLUMN live_url     TEXT`,
    `ALTER TABLE portfolio_items ADD COLUMN images       TEXT NOT NULL DEFAULT '[]'`,
    `ALTER TABLE portfolio_items ADD COLUMN client_name  TEXT`,
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch { /* column already exists — fine */ }
  }

  const { count } = db.prepare('SELECT COUNT(*) as count FROM portfolio_items').get() as { count: number };
  if (count === 0) seedData(db);

  backfillDemoData(db);
}

/* ── backfillDemoData removed — real project data seeded directly ──── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function backfillDemoData(_db: Database.Database) { /* no-op */ }

function seedData(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO portfolio_items
      (title, description, long_description, main_category, tags, item_order,
       client_name, cover_image, images, created_at, updated_at)
    VALUES
      (@title, @description, @longDescription, @mainCategory, @tags, @order,
       @clientName, @coverImage, @images, @createdAt, datetime('now'))
  `);

  const items = [
    {
      title: 'Zoho One Enterprise Implementation',
      description: 'Unified system implementation across departments for an international exhibition firm.',
      longDescription:
        'Delivered a unified operational system across all departments for a US-based global exhibition firm. Customised Zoho CRM and Zoho Desk significantly reduced support response time. Automated financial operations and reporting pipelines, reducing manual effort by 40% and enabling the team to focus on growth rather than administration.',
      mainCategory: 'SYSTEM_IMPLEMENTATION',
      tags: JSON.stringify(['Zoho One', 'Zoho CRM', 'Zoho Desk', 'Workflow Automation']),
      order: 1,
      clientName: 'Global Products Expo',
      coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80',
        'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=900&q=80',
      ]),
      createdAt: '2025-02-10 00:00:00',
    },
    {
      title: 'Real Estate CRM & HR Management System',
      description: 'Custom real estate CRM and HR management application built in Zoho Creator.',
      longDescription:
        'Built a tailored real estate CRM and HR management application inside Zoho Creator for a leading Turkish property group. Developed intelligent workflow automations that reduced administrative overhead by 35%. Integrated lead capture pipelines that boosted lead generation efficiency by 10% within the first quarter post-launch.',
      mainCategory: 'SYSTEM_IMPLEMENTATION',
      tags: JSON.stringify(['Zoho Creator', 'Zoho CRM', 'Workflow Automation', 'Real Estate']),
      order: 2,
      clientName: 'Baytak Group',
      coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1400&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=900&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=80',
        'https://images.unsplash.com/photo-1504615755583-2916b52192a3?w=900&q=80',
      ]),
      createdAt: '2025-01-05 00:00:00',
    },
    {
      title: 'Shopify Real-Time Inventory Sync Engine',
      description: 'Serverless AWS Lambda integration for real-time Shopify inventory synchronisation.',
      longDescription:
        'Engineered a serverless AWS Lambda function to synchronise Shopify stock levels in real-time across multiple sales channels. The solution slashed inventory discrepancies by 90% and dramatically improved order fulfilment accuracy, eliminating the manual reconciliation process that had been costing the team several hours per day.',
      mainCategory: 'APPS_PLUGINS',
      tags: JSON.stringify(['AWS Lambda', 'Shopify API', 'Node.js', 'Serverless']),
      order: 3,
      clientName: 'Pazarly',
      coverImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1400&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1553413077-190dd305871c?w=900&q=80',
        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&q=80',
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80',
      ]),
      createdAt: '2024-06-15 00:00:00',
    },
  ];

  for (const item of items) insert.run(item);
}

function rowToItem(row: Record<string, unknown>): PortfolioItem {
  return {
    id:              row.id as number,
    title:           row.title as string,
    description:     row.description as string,
    longDescription: row.long_description as string,
    mainCategory:    row.main_category as PortfolioItem['mainCategory'],
    tags:            JSON.parse((row.tags as string) || '[]'),
    order:           row.item_order as number,
    clientName:      (row.client_name  as string | null) ?? undefined,
    coverImage:      (row.cover_image  as string | null) ?? undefined,
    websiteUrl:      (row.website_url  as string | null) ?? undefined,
    liveUrl:         (row.live_url     as string | null) ?? undefined,
    images:          JSON.parse((row.images as string) || '[]'),
    createdAt:       row.created_at as string,
    updatedAt:       row.updated_at as string,
  };
}

export function getAllItems(): PortfolioItem[] {
  const db   = getDb();
  const rows = db.prepare('SELECT * FROM portfolio_items ORDER BY item_order ASC, id ASC').all();
  return (rows as Record<string, unknown>[]).map(rowToItem);
}

export function getItemById(id: number): PortfolioItem | null {
  const db  = getDb();
  const row = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(id);
  return row ? rowToItem(row as Record<string, unknown>) : null;
}

export function createItem(input: PortfolioItemInput): PortfolioItem {
  const db     = getDb();
  const result = db.prepare(`
    INSERT INTO portfolio_items
      (title, description, long_description, main_category, tags, item_order,
       client_name, cover_image, website_url, live_url, images)
    VALUES
      (@title, @description, @longDescription, @mainCategory, @tags, @order,
       @clientName, @coverImage, @websiteUrl, @liveUrl, @images)
  `).run({
    title:           input.title,
    description:     input.description,
    longDescription: input.longDescription,
    mainCategory:    input.mainCategory,
    tags:            JSON.stringify(input.tags),
    order:           input.order,
    clientName:      input.clientName  ?? null,
    coverImage:      input.coverImage  ?? null,
    websiteUrl:      input.websiteUrl  ?? null,
    liveUrl:         input.liveUrl     ?? null,
    images:          JSON.stringify(input.images ?? []),
  });
  return getItemById(result.lastInsertRowid as number)!;
}

export function updateItem(id: number, input: Partial<PortfolioItemInput>): PortfolioItem | null {
  const db       = getDb();
  const existing = getItemById(id);
  if (!existing) return null;

  const merged = {
    title:           input.title           ?? existing.title,
    description:     input.description     ?? existing.description,
    longDescription: input.longDescription ?? existing.longDescription,
    mainCategory:    input.mainCategory    ?? existing.mainCategory,
    tags:            JSON.stringify(input.tags ?? existing.tags),
    order:           input.order           ?? existing.order,
    clientName:      input.clientName      ?? existing.clientName  ?? null,
    coverImage:      input.coverImage      ?? existing.coverImage  ?? null,
    websiteUrl:      input.websiteUrl      ?? existing.websiteUrl  ?? null,
    liveUrl:         input.liveUrl         ?? existing.liveUrl     ?? null,
    images:          JSON.stringify(input.images ?? existing.images ?? []),
    id,
  };

  db.prepare(`
    UPDATE portfolio_items
    SET title=@title, description=@description, long_description=@longDescription,
        main_category=@mainCategory, tags=@tags, item_order=@order,
        client_name=@clientName, cover_image=@coverImage, website_url=@websiteUrl,
        live_url=@liveUrl, images=@images, updated_at=datetime('now')
    WHERE id=@id
  `).run(merged);

  return getItemById(id);
}

export function deleteItem(id: number): boolean {
  const db     = getDb();
  const result = db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(id);
  return result.changes > 0;
}

export function reorderItem(id: number, newOrder: number): void {
  const db = getDb();
  db.prepare(`UPDATE portfolio_items SET item_order=?, updated_at=datetime('now') WHERE id=?`).run(newOrder, id);
}
