'use server';

import { revalidatePath } from 'next/cache';
import * as db from '@/lib/db';
import type { PortfolioItemInput, MainCategory } from '@/types/portfolio';

export async function getPortfolioItems() {
  return db.getAllItems();
}

export async function createPortfolioItem(formData: FormData) {
  const input: PortfolioItemInput = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    longDescription: formData.get('longDescription') as string,
    mainCategory: formData.get('mainCategory') as MainCategory,
    tags: (formData.get('tags') as string).split(',').map((t) => t.trim()).filter(Boolean),
    order: parseInt(formData.get('order') as string) || 0,
    coverImage: (formData.get('coverImage') as string) || undefined,
  };

  const item = db.createItem(input);
  revalidatePath('/');
  revalidatePath('/portfolio');
  revalidatePath('/admin');
  return { success: true, item };
}

export async function updatePortfolioItem(id: number, formData: FormData) {
  const input: Partial<PortfolioItemInput> = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    longDescription: formData.get('longDescription') as string,
    mainCategory: formData.get('mainCategory') as MainCategory,
    tags: (formData.get('tags') as string).split(',').map((t) => t.trim()).filter(Boolean),
    order: parseInt(formData.get('order') as string) || 0,
    coverImage: (formData.get('coverImage') as string) || undefined,
  };

  const item = db.updateItem(id, input);
  if (!item) return { success: false, error: 'Item not found' };

  revalidatePath('/');
  revalidatePath('/portfolio');
  revalidatePath('/admin');
  return { success: true, item };
}

export async function deletePortfolioItem(id: number) {
  const deleted = db.deleteItem(id);
  revalidatePath('/');
  revalidatePath('/portfolio');
  revalidatePath('/admin');
  return { success: deleted };
}

export async function reorderPortfolioItem(id: number, newOrder: number) {
  db.reorderItem(id, newOrder);
  revalidatePath('/');
  revalidatePath('/portfolio');
  revalidatePath('/admin');
  return { success: true };
}
