import { Card, PageHeader } from '@/components/console/ui';
import { requireStaff } from '@/lib/auth/session';
import NewWorkspaceForm from './NewWorkspaceForm';

export default async function NewWorkspacePage() {
  await requireStaff();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Workspaces" title="New client workspace" description="Each client business gets its own workspace, API credentials and connected accounts. Data never crosses workspaces." />
      <Card>
        <NewWorkspaceForm />
      </Card>
    </div>
  );
}
