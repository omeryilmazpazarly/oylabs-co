import { getAllItems } from '@/lib/db';
import AdminClientShell from './AdminClientShell';
import { requireStaff } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin — OY Labs',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requireStaff();
  const items = getAllItems();
  return <AdminClientShell initialItems={items} />;
}
