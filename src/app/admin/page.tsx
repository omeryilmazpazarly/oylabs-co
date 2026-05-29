import { getAllItems } from '@/lib/db';
import AdminClientShell from './AdminClientShell';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin — OY Labs',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  const items = getAllItems();
  return <AdminClientShell initialItems={items} />;
}
