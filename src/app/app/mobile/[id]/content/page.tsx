import { Card, inputCls, labelCls, primaryBtn } from '@/components/console/ui';
import { StatusForm } from '@/components/console/client';
import { LocalizedField } from '@/components/apps/fields';
import { saveSettingsAction } from '../../actions';
import { loadApp } from '../load';

export default async function MobileContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { app, settings } = await loadApp(params);
  const { content, contact, integrations, features } = settings;
  const trust = [0, 1, 2].map((i) => content.trust[i] ?? { title: {}, subtitle: {} });
  return (
    <StatusForm action={saveSettingsAction} submitLabel="Save" pendingText="Saving…" submitClassName={primaryBtn} className="space-y-6">
      <input type="hidden" name="appId" value={app.id} />
      <input type="hidden" name="booleans" value="features.wishlist,features.reviews,features.reels" />
      <Card title="Text in the app" description="Write each line in English and Arabic; the app shows the customer's language.">
        <div className="space-y-5">
          <LocalizedField name="content.announcement" label="Announcement bar" value={content.announcement} maxLength={90}
            placeholder={{ en: 'Cash on delivery · inspect before you pay', ar: 'الدفع عند الاستلام · عاين قبل الدفع' }} />
          <LocalizedField name="content.welcomeTagline" label="Welcome screen line" value={content.welcomeTagline} maxLength={120} multiline />
          <LocalizedField name="content.welcomeFootnote" label="Welcome screen footnote" value={content.welcomeFootnote} maxLength={80} />
          <LocalizedField name="content.searchHint" label="Search box hint" value={content.searchHint} maxLength={50}
            placeholder={{ en: 'Search abayas, skirts, sets…', ar: 'ابحث عن عبايات، جيب، أطقم…' }} />
          <div>
            <div className={labelCls}>Promises under the home banner (up to three)</div>
            <div className="space-y-3">
              {trust.map((t, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-line-sub p-3 sm:grid-cols-2">
                  <input name={`content.trust.${i}.title.en`} defaultValue={t.title.en ?? ''} placeholder="Title, e.g. Cash on delivery" maxLength={40} className={inputCls} />
                  <input name={`content.trust.${i}.title.ar`} defaultValue={t.title.ar ?? ''} placeholder="العنوان" dir="rtl" maxLength={40} className={inputCls} />
                  <input name={`content.trust.${i}.subtitle.en`} defaultValue={t.subtitle.en ?? ''} placeholder="Detail, e.g. Pay when it arrives" maxLength={60} className={inputCls} />
                  <input name={`content.trust.${i}.subtitle.ar`} defaultValue={t.subtitle.ar ?? ''} placeholder="التفاصيل" dir="rtl" maxLength={60} className={inputCls} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
      <Card title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wa" className={labelCls}>WhatsApp number</label>
            <input id="wa" name="contact.whatsapp" defaultValue={contact.whatsapp ?? ''} placeholder="+201012345678" className={inputCls} />
            <p className="mt-1.5 text-xs text-ink-dim">International format. Powers "Ask on WhatsApp" and order help.</p>
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>Support email</label>
            <input id="email" name="contact.email" type="email" defaultValue={contact.email ?? ''} className={inputCls} />
          </div>
        </div>
      </Card>
      <Card title="Reviews and reels">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="jm" className={labelCls}>Judge.me public token</label>
            <input id="jm" name="integrations.judgemePublicToken" defaultValue={integrations.judgemePublicToken ?? ''} className={inputCls} />
            <p className="mt-1.5 text-xs text-ink-dim">Judge.me → Settings → Integrations → View API tokens → Public. Never the private one.</p>
          </div>
          <div>
            <label htmlFor="ig" className={labelCls}>Instagram account</label>
            <input id="ig" name="integrations.instagramHandle" defaultValue={integrations.instagramHandle ?? ''} placeholder="yourbrand" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="feed" className={labelCls}>Reels feed URL (Behold)</label>
            <input id="feed" name="integrations.reelsFeedUrl" defaultValue={integrations.reelsFeedUrl ?? ''} placeholder="https://feeds.behold.so/…" className={inputCls} />
          </div>
        </div>
      </Card>
      <Card title="Features">
        <div className="space-y-3 text-sm text-ink">
          {([['features.wishlist', 'Saved items (wishlist)', features.wishlist], ['features.reviews', 'Product reviews', features.reviews], ['features.reels', 'Reels tab', features.reels]] as const).map(([name, label, on]) => (
            <label key={name} className="flex items-center gap-3"><input type="checkbox" name={name} defaultChecked={on} className="h-4 w-4" />{label}</label>
          ))}
          <div className="pt-2">
            <label htmlFor="fs" className={labelCls}>Free shipping from (leave empty for none)</label>
            <input id="fs" name="features.freeShippingThreshold" type="number" min={0} defaultValue={features.freeShippingThreshold ?? ''} className={`${inputCls} max-w-xs`} />
          </div>
        </div>
      </Card>
    </StatusForm>
  );
}
