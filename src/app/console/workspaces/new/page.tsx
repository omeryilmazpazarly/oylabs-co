import { Card, PageHeader } from '@/components/console/ui';
import NewWorkspaceForm from './NewWorkspaceForm';

export default function NewWorkspacePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Workspaces" title="New client workspace" description="Each client business gets its own workspace, API credentials and connected accounts. Data never crosses workspaces." />
      <Card>
        <NewWorkspaceForm />
      </Card>
    </div>
  );
}
