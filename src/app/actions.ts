'use server';

import { revalidatePath } from 'next/cache';
import * as db from '@/lib/db';
import type { PortfolioItemInput, MainCategory } from '@/types/portfolio';
import { sendContactEmails } from '@/lib/email';

/* ── Turnstile verification ─────────────────────────────────────────── */
async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // No key configured — skip verification in dev
    console.warn('[Turnstile] TURNSTILE_SECRET_KEY not set, skipping verification');
    return true;
  }
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });
  const json = await res.json() as { success: boolean };
  return json.success;
}

/* ── Contact form submission ────────────────────────────────────────── */
export async function submitContactForm(formData: FormData) {
  const name        = (formData.get('name')           as string | null)?.trim() ?? '';
  const email       = (formData.get('email')          as string | null)?.trim() ?? '';
  const projectType = (formData.get('projectType')    as string | null)?.trim() ?? '';
  const brief       = (formData.get('brief')          as string | null)?.trim() ?? '';
  const token       = (formData.get('turnstileToken') as string | null)          ?? '';

  if (!name || !email || !brief) {
    return { success: false, error: 'Please fill in all required fields.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const valid = await verifyTurnstile(token);
  if (!valid) {
    return { success: false, error: 'Security check failed. Please try again.' };
  }

  try {
    await sendContactEmails({ name, email, projectType, brief });
    return { success: true };
  } catch (err) {
    console.error('[Contact] Email send failed:', err);
    return { success: false, error: 'Failed to send message. Please try again or email us directly.' };
  }
}

function revalidateAll() {
  revalidatePath('/');
  revalidatePath('/portfolio');
  revalidatePath('/admin');
}

export async function getPortfolioItems() {
  return db.getAllItems();
}

export async function createPortfolioItem(formData: FormData) {
  const input: PortfolioItemInput = {
    title:           formData.get('title')           as string,
    description:     formData.get('description')     as string,
    longDescription: formData.get('longDescription') as string,
    mainCategory:    formData.get('mainCategory')    as MainCategory,
    tags:  (formData.get('tags')   as string).split(',').map((t) => t.trim()).filter(Boolean),
    order: parseInt(formData.get('order') as string) || 0,
    clientName:  (formData.get('clientName')  as string) || undefined,
    coverImage:  (formData.get('coverImage')  as string) || undefined,
    websiteUrl:  (formData.get('websiteUrl')  as string) || undefined,
    liveUrl:     (formData.get('liveUrl')     as string) || undefined,
    images: (formData.get('images') as string || '')
              .split('\n').map((s) => s.trim()).filter(Boolean),
  };

  const item = db.createItem(input);
  revalidateAll();
  return { success: true, item };
}

export async function updatePortfolioItem(id: number, formData: FormData) {
  const input: Partial<PortfolioItemInput> = {
    title:           formData.get('title')           as string,
    description:     formData.get('description')     as string,
    longDescription: formData.get('longDescription') as string,
    mainCategory:    formData.get('mainCategory')    as MainCategory,
    tags:  (formData.get('tags')   as string).split(',').map((t) => t.trim()).filter(Boolean),
    order: parseInt(formData.get('order') as string) || 0,
    clientName:  (formData.get('clientName')  as string) || undefined,
    coverImage:  (formData.get('coverImage')  as string) || undefined,
    websiteUrl:  (formData.get('websiteUrl')  as string) || undefined,
    liveUrl:     (formData.get('liveUrl')     as string) || undefined,
    images: (formData.get('images') as string || '')
              .split('\n').map((s) => s.trim()).filter(Boolean),
  };

  const item = db.updateItem(id, input);
  if (!item) return { success: false, error: 'Item not found' };

  revalidateAll();
  revalidatePath(`/portfolio/${id}`);
  return { success: true, item };
}

export async function deletePortfolioItem(id: number) {
  const deleted = db.deleteItem(id);
  revalidateAll();
  return { success: deleted };
}

export async function reorderPortfolioItem(id: number, newOrder: number) {
  db.reorderItem(id, newOrder);
  revalidateAll();
  return { success: true };
}
