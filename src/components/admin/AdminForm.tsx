'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag, Loader2, Globe, ExternalLink, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import type { PortfolioItem, MainCategory } from '@/types/portfolio';
import { CATEGORY_LABELS } from '@/types/portfolio';
import { createPortfolioItem, updatePortfolioItem } from '@/app/actions';

const CATEGORIES: MainCategory[] = ['SYSTEM_IMPLEMENTATION', 'WEBSITES', 'APPS_PLUGINS', 'MOBILE_APPS'];

/* ── Upload helper ─────────────────────────────────────────────── */
async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url as string;
}

/* ── Cover Image Uploader ──────────────────────────────────────── */
function CoverUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragging, setDragging]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      {/* Preview or drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-all overflow-hidden
          ${dragging ? 'border-white/40 bg-white/5' : 'border-[#2a2a2a] bg-[#0a0a0a]'}
          ${value ? 'h-40' : 'h-32'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-white bg-black/70 border border-white/20 rounded-lg px-3 py-1.5 hover:bg-black/90 transition-all"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="flex items-center gap-1.5 text-xs text-white bg-black/70 border border-red-500/30 rounded-lg px-3 py-1.5 hover:bg-red-900/40 transition-all"
              >
                <X size={12} /> Remove
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#3f3f46] hover:text-[#71717a] transition-colors"
          >
            {uploading
              ? <Loader2 size={20} className="animate-spin" />
              : <Upload size={20} />
            }
            <span className="text-xs">{uploading ? 'Uploading…' : 'Click or drag to upload'}</span>
            <span className="text-[10px] text-[#2a2a2a]">JPEG · PNG · WEBP · AVIF — max 10 MB</span>
          </button>
        )}
      </div>

      {/* URL fallback */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#3f3f46] uppercase tracking-widest shrink-0">or paste URL</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-2 text-xs text-white placeholder-[#2a2a2a] focus:outline-none focus:border-[#333] transition-colors font-mono"
        />
      </div>

      {uploadError && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle size={11} /> {uploadError}
        </p>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

/* ── Gallery Uploader ──────────────────────────────────────────── */
function GalleryUploader({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragging, setDragging]   = useState(false);
  const [urlInput, setUrlInput]   = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: File[]) {
    setUploading(true);
    setUploadError('');
    try {
      const urls = await Promise.all(files.map(uploadFile));
      onChange([...value, ...urls]);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function addUrl() {
    const url = urlInput.trim();
    if (url && !value.includes(url)) onChange([...value, url]);
    setUrlInput('');
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) handleFiles(files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="space-y-3">
      {/* Thumbnail grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, i) => (
            <div key={i} className="relative group aspect-video rounded-lg overflow-hidden border border-[#1a1a1a]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/60"
              >
                <X size={10} />
              </button>
              <div className="absolute bottom-1 left-1 text-[9px] text-white/50 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-all h-24 flex flex-col items-center justify-center gap-1.5
          ${dragging ? 'border-white/40 bg-white/5' : 'border-[#2a2a2a] bg-[#0a0a0a]'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[#3f3f46] hover:text-[#71717a] transition-colors"
        >
          {uploading
            ? <><Loader2 size={18} className="animate-spin" /><span className="text-xs">Uploading…</span></>
            : <><Upload size={18} /><span className="text-xs">Click or drag images here (multi-select supported)</span></>
          }
        </button>
      </div>

      {/* URL add */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#3f3f46] uppercase tracking-widest shrink-0">or add URL</span>
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          placeholder="https://..."
          className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-2 text-xs text-white placeholder-[#2a2a2a] focus:outline-none focus:border-[#333] transition-colors font-mono"
        />
        <button
          type="button"
          onClick={addUrl}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-[#222] text-[#71717a] hover:text-white hover:border-[#444] transition-all"
        >
          <Plus size={14} />
        </button>
      </div>

      {uploadError && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <AlertCircle size={11} /> {uploadError}
        </p>
      )}

      <input
        ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { const files = Array.from(e.target.files ?? []); if (files.length) handleFiles(files); e.target.value = ''; }}
      />
    </div>
  );
}

/* ── Main Form ─────────────────────────────────────────────────── */
interface Props {
  item?: PortfolioItem | null;
  onClose: () => void;
}

export default function AdminForm({ item, onClose }: Props) {
  const isEdit = Boolean(item);
  const [isPending, startTransition] = useTransition();
  const [tags, setTags]           = useState<string[]>(item?.tags ?? []);
  const [tagInput, setTagInput]   = useState('');
  const [error, setError]         = useState('');
  const [coverImage, setCoverImage] = useState(item?.coverImage ?? '');
  const [galleryImages, setGalleryImages] = useState<string[]>(item?.images ?? []);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setTags(item?.tags ?? []);
    setCoverImage(item?.coverImage ?? '');
    setGalleryImages(item?.images ?? []);
  }, [item]);

  function addTag(e?: React.KeyboardEvent) {
    if (e && e.key !== 'Enter' && e.key !== ',') return;
    e?.preventDefault();
    const val = tagInput.trim().replace(/,$/, '');
    if (val && !tags.includes(val)) setTags((prev) => [...prev, val]);
    setTagInput('');
  }
  function removeTag(tag: string) { setTags((prev) => prev.filter((t) => t !== tag)); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    fd.set('tags', tags.join(','));
    fd.set('coverImage', coverImage);
    fd.set('images', galleryImages.join('\n'));

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

  const inputCls = 'w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-sm text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#444] transition-colors';
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
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', stiffness: 120, damping: 22, mass: 0.8 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#222] bg-[#111]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a] sticky top-0 bg-[#111] z-10">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                {isEdit ? 'Edit Project' : 'New Project'}
              </h2>
              <p className="text-xs text-[#71717a] mt-0.5">
                {isEdit ? `Editing: ${item!.title}` : 'Add a new portfolio project'}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#222] text-[#71717a] hover:text-white hover:border-[#444] transition-all">
              <X size={14} />
            </button>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* ── Core fields ── */}
            <div>
              <label className={labelCls}>Title *</label>
              <input name="title" required defaultValue={item?.title} placeholder="Project title" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Short Description *</label>
              <input name="description" required defaultValue={item?.description} placeholder="One-line summary" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Long Description *</label>
              <textarea name="longDescription" required defaultValue={item?.longDescription} rows={4} placeholder="Full project description..." className={`${inputCls} resize-none`} />
            </div>

            {/* Category + Order */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category *</label>
                <select name="mainCategory" required defaultValue={item?.mainCategory ?? ''} className={`${inputCls} appearance-none`}>
                  <option value="" disabled>Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Display Order</label>
                <input name="order" type="number" defaultValue={item?.order ?? 0} min={0} className={inputCls} />
              </div>
            </div>

            {/* ── Client ── */}
            <div className="pt-2 border-t border-[#1a1a1a]">
              <p className="text-[10px] text-[#3f3f46] tracking-[0.3em] uppercase font-medium mb-4">Client</p>
              <div>
                <label className={labelCls}>Client / Company Name</label>
                <input name="clientName" defaultValue={item?.clientName} placeholder="Acme Corp" className={inputCls} />
                <p className="mt-1.5 text-xs text-[#3f3f46]">Shown on the project page, hyperlinked to the Website URL if provided.</p>
              </div>
            </div>

            {/* ── Media ── */}
            <div className="pt-2 border-t border-[#1a1a1a] space-y-5">
              <p className="text-[10px] text-[#3f3f46] tracking-[0.3em] uppercase font-medium">Media</p>

              {/* Cover Image */}
              <div>
                <label className={labelCls}>
                  <ImageIcon size={11} className="inline mr-1.5 mb-0.5" />
                  Hero Banner Image
                </label>
                <CoverUploader value={coverImage} onChange={setCoverImage} />
                <p className="mt-2 text-xs text-[#3f3f46]">Full-bleed banner shown on the project detail page &amp; portfolio card.</p>
              </div>

              {/* Gallery */}
              <div>
                <label className={labelCls}>
                  <ImageIcon size={11} className="inline mr-1.5 mb-0.5" />
                  Gallery Images
                </label>
                <GalleryUploader value={galleryImages} onChange={setGalleryImages} />
                <p className="mt-1.5 text-xs text-[#3f3f46]">Shown as a clickable grid gallery on the project detail page.</p>
              </div>
            </div>

            {/* ── Links ── */}
            <div className="pt-2 border-t border-[#1a1a1a] space-y-4">
              <p className="text-[10px] text-[#3f3f46] tracking-[0.3em] uppercase font-medium">Links</p>

              <div>
                <label className={labelCls}>
                  <Globe size={11} className="inline mr-1.5 mb-0.5" />
                  Website URL
                </label>
                <input name="websiteUrl" defaultValue={item?.websiteUrl} placeholder="https://client-site.com" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>
                  <ExternalLink size={11} className="inline mr-1.5 mb-0.5" />
                  Live Demo / Preview URL
                </label>
                <input name="liveUrl" defaultValue={item?.liveUrl} placeholder="https://demo.client-site.com" className={inputCls} />
              </div>
            </div>

            {/* ── Tags ── */}
            <div className="pt-2 border-t border-[#1a1a1a]">
              <p className="text-[10px] text-[#3f3f46] tracking-[0.3em] uppercase font-medium mb-4">Technology Tags</p>
              <div className="border border-[#222] rounded-lg bg-[#0a0a0a] p-3 min-h-[48px] focus-within:border-[#444] transition-colors">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1.5 text-xs text-white bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1">
                      <Tag size={9} className="text-[#71717a]" />
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-[#71717a] hover:text-white transition-colors">
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
                  <button type="button" onClick={() => addTag()} className="text-[#71717a] hover:text-white transition-colors">
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
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm text-[#71717a] border border-[#222] hover:text-white hover:border-[#444] transition-all">
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-black text-sm font-semibold tracking-wide hover:bg-[#e4e4e7] transition-all active:scale-95 disabled:opacity-50">
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
