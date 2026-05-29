import type { MainCategory } from '@/types/portfolio';

export const CATEGORY_COLORS: Record<MainCategory, string> = {
  SYSTEM_IMPLEMENTATION: '#7c3aed',
  WEBSITES:              '#0ea5e9',
  APPS_PLUGINS:          '#10b981',
  MOBILE_APPS:           '#f59e0b',
};

export const COVER_GRADIENTS: Record<MainCategory, string> = {
  SYSTEM_IMPLEMENTATION: 'from-[#1a0a2e] via-[#0f0f1a] to-[#111]',
  WEBSITES:              'from-[#0a1a2e] via-[#0f0f1a] to-[#111]',
  APPS_PLUGINS:          'from-[#0a2e1a] via-[#0f0f1a] to-[#111]',
  MOBILE_APPS:           'from-[#2e1a0a] via-[#0f0f1a] to-[#111]',
};
