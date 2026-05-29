'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag, Loader2 } from 'lucide-react';
import type { PortfolioItem, MainCategory } from '@/types/portfolio';
import { CATEGORY_LABELS } from '@/types/portfolio';
import { createPortfolioItem, updatePortfolioItem } from '@/app/actions';

const CATEGORIES: MainCategory[] = ['SYSTEM_IMPLEMENTATION', 'WEBSITES', 'APPS_PLUGINS', 'MOBILE_APPS'];

interface Props {
  item?: PortfolioItem | null;
  onClose: () => void;
}

export default function AdminForm({ item, onClose }: Props) {
  const isEdit = Boolean(item);
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState<string[]>(item?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setTags(item?.tags ?? []);
  }, [item]);

  function addTag(e?: React.KeyboardEvent) {
    if (e && e.key !== 'Enter' && e.key !== ',') return;
    e?.preventDefault();
    const val = tagInput.trim().replace(/,$/, '');
    if (val && !tags.includes(val)) setTags((prev) => [...prev, val]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set('tags', tags.join(','));

    startTransition(async () => {
      const res = isEdit
        ? await updatePortfolioItem(item!.id, fd)
        : await createPortfolioItem(fd);
      if (!res.success) {
        setError('error' in res ? res.error : 'Something went wrong');
        return;
      }
      onClose();
    });
  }

  const inputCls =
    'w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-sm text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#444] transition-colors';
  const labelCls = 'block text-xs text-[#71717a] tracking-widest uppercase mb-2';

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', stiffness: 120, damping: 22, mass: 0.8 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#222] bg-[#111]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                {isEdit ? 'Edit Project' : 'New Project'}
              </h2>
              <p className="text-xs text-[#71717a] mt-0.5">
                {isEdit ? `Editing: ${item!.title}` : 'Add a new portfolio project'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#222] text-[#71717a] hover:text-white hover:border-[#444] transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className={labelCls}>Title *</label>
              <input
                name="title"
                required
                defaultValue={item?.title}
                placeholder="Project title"
                className={inputCls}
              />
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Short Description *</label>
              <input
                name="description"
                required
                defaultValue={item?.description}
                placeholder="One-line summary"
                className={inputCls}
              />
            </div>

            {/* Long Description */}
            <div>
              <label className={labelCls}>Long Description *</label>
              <textarea
                name="longDescription"
                required
                defaultValue={item?.longDescription}
                rows={4}
                placeholder="Full project description..."
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Category + Order row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category *</label>
                <select
                  name="mainCategory"
                  required
                  defaultValue={item?.mainCategory ?? ''}
                  className={`${inputCls} appearance-none`}
                >
                  <option value="" disabled>Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Display Order</label>
                <input
                  name="order"
                  type="number"
                  defaultValue={item?.order ?? 0}
                  min={0}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label className={labelCls}>Cover Image URL</label>
              <input
                name="coverImage"
                defaultValue={item?.coverImage}
                placeholder="https://..."
                className={inputCls}
              />
            </div>

            {/* Tags */}
            <div>
              <label className={labelCls}>Technology Tags</label>
              <div className="border border-[#222] rounded-lg bg-[#0a0a0a] p-3 min-h-[48px] focus-within:border-[#444] transition-colors">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 text-xs text-white bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1"
                    >
                      <Tag size={9} className="text-[#71717a]" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-[#71717a] hover:text-white transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder="Add tag, press Enter..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-[#3f3f46] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addTag()}
                    className="text-[#71717a] hover:text-white transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-[#3f3f46]">Press Enter or comma to add. Click × to remove.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg text-sm text-[#71717a] border border-[#222] hover:text-white hover:border-[#444] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-black text-sm font-semibold tracking-wide hover:bg-[#e4e4e7] transition-all active:scale-95 disabled:opacity-50"
              >
                {isPending && <Loader2 size={13} className="animate-spin" />}
                {isEdit ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
