'use server';

import { revalidatePath } from 'next/cache';
import * as db from '@/lib/db';
import type { PortfolioItemInput, MainCategory } from '@/types/portfolio';

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
