import type { AppStatus } from '@/lib/apps/apps';
import type { Tone } from '@/components/console/ui';

export const STATUS_LABEL: Record<AppStatus, string> = { setup: 'Setting up', building: 'Building', live: 'Live', paused: 'Paused' };
export const STATUS_TONE: Record<AppStatus, Tone> = { setup: 'amber', building: 'blue', live: 'green', paused: 'gray' };
