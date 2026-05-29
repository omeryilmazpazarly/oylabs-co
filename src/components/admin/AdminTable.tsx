'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import type { PortfolioItem } from '@/types/portfolio';
import { CATEGORY_LABELS } from '@/types/portfolio';
import { deletePortfolioItem, reorderPortfolioItem } from '@/app/actions';

interface Props {
  items: PortfolioItem[];
  onEdit: (item: PortfolioItem) => void;
  onNew: () => void;
}

export default function AdminTable({ items, onEdit, onNew }: Props) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function handleDelete(id: number) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setDeletingId(id);
    startTransition(async () => {
      await deletePortfolioItem(id);
      setDeletingId(null);
    });
  }

  function handleOrder(id: number, dir: 'up' | 'down', currentOrder: number) {
    const newOrder = dir === 'up' ? currentOrder - 1 : currentOrder + 1;
    startTransition(async () => { await reorderPortfolioItem(id, newOrder); });
  }

  const CATEGORY_DOTS: Record<string, string> = {
    SYSTEM_IMPLEMENTATION: '#7c3aed',
    WEBSITES: '#0ea5e9',
    APPS_PLUGINS: '#10b981',
    MOBILE_APPS: '#f59e0b',
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">System Inventory</h2>
          <p className="text-xs text-[#71717a] mt-0.5">{items.length} project{items.length !== 1 ? 's' : ''} loaded</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold tracking-wide hover:bg-[#e4e4e7] transition-all active:scale-95"
        >
          <Plus size={13} />
          New Project
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#222] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_80px] gap-4 px-5 py-3 bg-[#0a0a0a] border-b border-[#1a1a1a]">
          {['Title', 'Category', 'Order', 'Actions'].map((h) => (
            <span key={h} className="text-xs text-[#3f3f46] tracking-[0.2em] uppercase font-medium">
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {items.length === 0 ? (
          <div className="text-center py-16 text-[#3f3f46] text-sm">No projects yet. Create one above.</div>
        ) : (
          items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: deletingId === item.id ? 0.4 : 1 }}
              transition={{ duration: 0.2 }}
              className={`grid grid-cols-[2fr_1fr_1fr_80px] gap-4 px-5 py-4 items-center border-b border-[#111] hover:bg-[#0d0d0d] transition-colors ${
                i === items.length - 1 ? 'border-b-0' : ''
              }`}
            >
              {/* Title */}
              <div>
                <p className="text-sm text-white font-medium tracking-tight truncate">{item.title}</p>
                <p className="text-xs text-[#3f3f46] mt-0.5 truncate">{item.description}</p>
              </div>

              {/* Category */}
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_DOTS[item.mainCategory] }}
                />
                <span className="text-xs text-[#71717a] tracking-wide truncate">
                  {CATEGORY_LABELS[item.mainCategory]}
                </span>
              </div>

              {/* Order */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#71717a] font-mono w-6">{item.order}</span>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleOrder(item.id, 'up', item.order)}
                    disabled={isPending}
                    className="text-[#3f3f46] hover:text-white transition-colors disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => handleOrder(item.id, 'down', item.order)}
                    disabled={isPending}
                    className="text-[#3f3f46] hover:text-white transition-colors disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(item)}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-[#222] text-[#71717a] hover:text-white hover:border-[#444] transition-all"
                  aria-label="Edit"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isPending}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-[#222] text-[#71717a] hover:text-red-400 hover:border-red-500/40 transition-all disabled:opacity-30"
                  aria-label="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
