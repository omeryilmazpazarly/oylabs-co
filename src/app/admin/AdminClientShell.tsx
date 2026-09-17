'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, Database, MessagesSquare } from 'lucide-react';
import type { PortfolioItem } from '@/types/portfolio';
import AdminTable from '@/components/admin/AdminTable';
import AdminForm from '@/components/admin/AdminForm';

interface Props {
  initialItems: PortfolioItem[];
}

export default function AdminClientShell({ initialItems }: Props) {
  const [editTarget, setEditTarget] = useState<PortfolioItem | null | undefined>(undefined);
  const showForm = editTarget !== undefined;

  return (
    <div className="min-h-screen bg-[#000] pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-[#111] border border-[#222] flex items-center justify-center">
                <Database size={12} className="text-[#71717a]" />
              </div>
              <span className="text-xs text-[#71717a] tracking-[0.2em] uppercase">Admin</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Control Engine</h1>
            <p className="text-sm text-[#71717a] mt-1">Manage portfolio projects, categories, and ordering.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/console"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#222] text-xs text-[#71717a] hover:text-white hover:border-[#444] transition-all"
            >
              <MessagesSquare size={12} />
              Console
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#222] text-xs text-[#71717a] hover:text-white hover:border-[#444] transition-all"
            >
              <LayoutGrid size={12} />
              View Site
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Projects', value: initialItems.length },
            { label: 'System Implementations', value: initialItems.filter((i) => i.mainCategory === 'SYSTEM_IMPLEMENTATION').length },
            { label: 'Websites', value: initialItems.filter((i) => i.mainCategory === 'WEBSITES').length },
            { label: 'Apps & Mobile', value: initialItems.filter((i) => i.mainCategory === 'APPS_PLUGINS' || i.mainCategory === 'MOBILE_APPS').length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
              <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
              <div className="text-xs text-[#71717a] mt-1 tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <AdminTable
            items={initialItems}
            onEdit={(item) => setEditTarget(item)}
            onNew={() => setEditTarget(null)}
          />
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <AdminForm
          item={editTarget}
          onClose={() => setEditTarget(undefined)}
        />
      )}
    </div>
  );
}
