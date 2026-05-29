import { notFound } from 'next/navigation';
import { getAllItems, getItemById } from '@/lib/db';
import ProjectDetailClient from './ProjectDetailClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getItemById(Number(id));
  if (!item) return { title: 'Not Found' };
  return {
    title: `${item.title} — OY Labs`,
    description: item.description,
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getItemById(Number(id));
  if (!item) notFound();

  const allItems = getAllItems();
  const related  = allItems.filter((i) => i.id !== item.id && i.mainCategory === item.mainCategory).slice(0, 2);
  const nextItem = allItems.find((i) => i.order > item.order) ?? allItems[0];

  return <ProjectDetailClient item={item} related={related} nextItem={nextItem} />;
}
