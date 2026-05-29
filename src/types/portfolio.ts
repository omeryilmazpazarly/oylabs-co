export type MainCategory =
  | 'SYSTEM_IMPLEMENTATION'
  | 'WEBSITES'
  | 'APPS_PLUGINS'
  | 'MOBILE_APPS';

export const CATEGORY_LABELS: Record<MainCategory, string> = {
  SYSTEM_IMPLEMENTATION: 'System Implementation',
  WEBSITES:              'Websites',
  APPS_PLUGINS:          'Apps & Plugins',
  MOBILE_APPS:           'Mobile Apps',
};

export interface PortfolioItem {
  id:              number;
  title:           string;
  description:     string;
  longDescription: string;
  mainCategory:    MainCategory;
  tags:            string[];
  order:           number;
  clientName?:     string;   // client / company name
  coverImage?:     string;   // hero banner image URL
  websiteUrl?:     string;   // live website link
  liveUrl?:        string;   // demo / preview link
  images:          string[]; // gallery screenshots
  createdAt:       string;
  updatedAt:       string;
}

export type PortfolioItemInput = Omit<PortfolioItem, 'id' | 'createdAt' | 'updatedAt'>;
