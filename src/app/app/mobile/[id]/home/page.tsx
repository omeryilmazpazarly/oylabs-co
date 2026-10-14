import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Badge, Card, EmptyState, inputCls, labelCls, primaryBtn, secondaryBtn } from '@/components/console/ui';
import { StatusForm } from '@/components/console/client';
import { ImageField } from '@/components/apps/fields';
import { listBanners, type Banner, type BannerKind } from '@/lib/apps/apps';
import { deleteBannerAction, moveBannerAction, saveBannerAction } from '../../actions';
import { loadApp } from '../load';

const KIND_LABEL: Record<BannerKind, string> = {
  hero: 'Large banner',
  banner: 'Promo strip',
  collection_row: 'Product row (swipe)',
  product_grid: 'Product grid',
  text: 'Text block',
};

const toInput = (ms: number | null) => (ms ? new Date(ms).toISOString().slice(0, 16) : '');

function BannerFields({ appId, banner }: { appId: number; banner?: Banner }) {
  return (
    <>
      <input type="hidden" name="appId" value={appId} />
      {banner && <input type="hidden" name="bannerId" value={banner.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Type</label>
          <select name="kind" defaultValue={banner?.kind ?? 'hero'} className={inputCls}>
            {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Collection handle</label>
          <input name="collectionHandle" defaultValue={banner?.collection_handle ?? ''} placeholder="summer-collection" className={inputCls} />
          <p className="mt-1 text-xs text-ink-dim">Needed for product rows and grids; the last part of the collection&apos;s URL.</p>
        </div>
        <input name="titleEn" defaultValue={banner?.title_en ?? ''} placeholder="Title (English)" maxLength={80} className={inputCls} />
        <input name="titleAr" defaultValue={banner?.title_ar ?? ''} placeholder="العنوان (عربي)" dir="rtl" maxLength={80} className={inputCls} />
        <input name="subtitleEn" defaultValue={banner?.subtitle_en ?? ''} placeholder="Subtitle (English)" maxLength={200} className={inputCls} />
        <input name="subtitleAr" defaultValue={banner?.subtitle_ar ?? ''} placeholder="الوصف (عربي)" dir="rtl" maxLength={200} className={inputCls} />
        <input name="ctaEn" defaultValue={banner?.cta_en ?? ''} placeholder="Button (English), e.g. Shop now" maxLength={30} className={inputCls} />
        <input name="ctaAr" defaultValue={banner?.cta_ar ?? ''} placeholder="الزر (عربي)" dir="rtl" maxLength={30} className={inputCls} />
        <div className="sm:col-span-2">
          <label className={labelCls}>Opens</label>
          <input name="link" defaultValue={banner?.link ?? ''} placeholder="/collections/summer-collection, /products/pleated-skirt or https://…" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <ImageField appId={appId} name="imageUrl" label="Image" defaultValue={banner?.image_url} hint="Large banners: portrait or 4:3 photos, at least 1080 px wide." />
        </div>
        <div>
          <label className={labelCls}>Show from (optional)</label>
          <input type="datetime-local" name="startsAt" defaultValue={toInput(banner?.starts_at ?? null)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Show until (optional)</label>
          <input type="datetime-local" name="endsAt" defaultValue={toInput(banner?.ends_at ?? null)} className={inputCls} />
        </div>
        <label className="flex items-center gap-3 text-sm text-ink"><input type="checkbox" name="active" defaultChecked={banner ? !!banner.active : true} className="h-4 w-4" />Visible in the app</label>
      </div>
    </>
  );
}

export default async function MobileHomePage({ params }: { params: Promise<{ id: string }> }) {
  const { app } = await loadApp(params);
  const banners = listBanners(app.id);
  return (
    <div className="space-y-6">
      <Card title="Home screen" description="Sections appear in this order. With none, the app shows your collections automatically.">
        {banners.length === 0 ? (
          <EmptyState title="No sections yet">Add a large banner for your current campaign, then a product row or two.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {banners.map((b, i) => (
              <li key={b.id} className="rounded-xl border border-line-sub">
                <details>
                  <summary className="flex cursor-pointer items-center gap-3 px-4 py-3">
                    <span className="text-xs text-ink-dim">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{b.title_en || b.title_ar || b.collection_handle || KIND_LABEL[b.kind]}</span>
                    <Badge>{KIND_LABEL[b.kind]}</Badge>
                    {!b.active && <Badge tone="gray">Hidden</Badge>}
                  </summary>
                  <div className="space-y-4 border-t border-line-sub p-4">
                    <StatusForm action={saveBannerAction} submitLabel="Save section" pendingText="Saving…" submitClassName={primaryBtn}>
                      <BannerFields appId={app.id} banner={b} />
                    </StatusForm>
                    <div className="flex flex-wrap gap-2">
                      {(['up', 'down'] as const).map((d) => (
                        <form key={d} action={moveBannerAction}>
                          <input type="hidden" name="appId" value={app.id} />
                          <input type="hidden" name="bannerId" value={b.id} />
                          <input type="hidden" name="direction" value={d} />
                          <button className={secondaryBtn} disabled={(d === 'up' && i === 0) || (d === 'down' && i === banners.length - 1)}>
                            {d === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />} Move {d}
                          </button>
                        </form>
                      ))}
                      <form action={deleteBannerAction}>
                        <input type="hidden" name="appId" value={app.id} />
                        <input type="hidden" name="bannerId" value={b.id} />
                        <button className={secondaryBtn}><Trash2 size={14} /> Delete</button>
                      </form>
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Add a section">
        <StatusForm action={saveBannerAction} submitLabel="Add section" pendingText="Adding…" submitClassName={primaryBtn} resetOnSuccess>
          <BannerFields appId={app.id} />
        </StatusForm>
      </Card>
    </div>
  );
}
