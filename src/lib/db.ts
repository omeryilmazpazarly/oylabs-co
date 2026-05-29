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
    `ALTER TABLE portfolio_items ADD COLUMN website_url TEXT`,
    `ALTER TABLE portfolio_items ADD COLUMN live_url    TEXT`,
    `ALTER TABLE portfolio_items ADD COLUMN images      TEXT NOT NULL DEFAULT '[]'`,
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch { /* column already exists — fine */ }
  }

  const { count } = db.prepare('SELECT COUNT(*) as count FROM portfolio_items').get() as { count: number };
  if (count === 0) seedData(db);
}

function seedData(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO portfolio_items (title, description, long_description, main_category, tags, item_order)
    VALUES (@title, @description, @longDescription, @mainCategory, @tags, @order)
  `);

  const items = [
    {
      title: 'Unified Global Trade Expo Ecosystem',
      description: 'Total automation architecture engineered for an international exhibition firm.',
      longDescription:
        'A complete operational overhaul unifying sales pipelines, enterprise finance, and real-time logistics tracking into a singular, high-availability Zoho One instance connected via serverless API hooks.',
      mainCategory: 'SYSTEM_IMPLEMENTATION',
      tags: JSON.stringify(['Zoho One', 'API Architecture', 'n8n Pipelines', 'Workflow Optimization']),
      order: 1,
    },
    {
      title: 'Headless Shopify Native App Builder',
      description: 'A high-performance framework translating e-commerce storefronts into native applications.',
      longDescription:
        'A technical implementation enabling enterprise storefronts to compile live web stores directly into optimized mobile binaries, maximizing performance and mobile-checkout conversion rates.',
      mainCategory: 'MOBILE_APPS',
      tags: JSON.stringify(['Shopify API', 'Next.js', 'Cross-Platform Mobile', 'Headless Commerce']),
      order: 2,
    },
    {
      title: 'SaaS Financial Profit Analytics Engine',
      description: 'Automated profit and cash-flow data extraction engine for small business operations.',
      longDescription:
        'A secure dashboard application linking multi-channel accounting data, computing net profit margins automatically, and projecting cash runaways on a streamlined, minimal web interface.',
      mainCategory: 'APPS_PLUGINS',
      tags: JSON.stringify(['Node.js', 'AWS Lambda', 'Financial Dashboards', 'SaaS Architecture']),
      order: 3,
    },
    {
      title: 'High-Volume Minimalist Storefront Architectures',
      description: 'Custom optimised e-commerce architectures integrating WordPress and Shopify frameworks.',
      longDescription:
        'Engineering high-speed, secure, and presentation-critical web nodes capable of maintaining peak structural performance under intense global traffic spikes.',
      mainCategory: 'WEBSITES',
      tags: JSON.stringify(['Shopify', 'WordPress Core', 'Tailwind CSS', 'Performance Optimization']),
      order: 4,
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
    coverImage:      (row.cover_image as string | null) ?? undefined,
    websiteUrl:      (row.website_url as string | null) ?? undefined,
    liveUrl:         (row.live_url    as string | null) ?? undefined,
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
       cover_image, website_url, live_url, images)
    VALUES
      (@title, @description, @longDescription, @mainCategory, @tags, @order,
       @coverImage, @websiteUrl, @liveUrl, @images)
  `).run({
    title:           input.title,
    description:     input.description,
    longDescription: input.longDescription,
    mainCategory:    input.mainCategory,
    tags:            JSON.stringify(input.tags),
    order:           input.order,
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
        cover_image=@coverImage, website_url=@websiteUrl, live_url=@liveUrl,
        images=@images, updated_at=datetime('now')
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
