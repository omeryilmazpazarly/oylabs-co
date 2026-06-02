'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen, Zap, Settings, Globe, HelpCircle,
  ChevronRight, ArrowLeft, AlertCircle, CheckCircle2,
  Palette, Users, BarChart2, ArrowRight, GitBranch,
  Webhook, FileSpreadsheet, Sparkles, MessageSquare,
  Eye, Database,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CORAL = '#E8654A';
const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Sidebar ────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: 'getting-started', icon: Zap, label: 'Getting Started', sub: ['What is Greet?', 'Installation', 'Enable App Embed', 'Quick Start'] },
  { id: 'flow-builder', icon: MessageSquare, label: 'Flow Builder', sub: ['Steps', 'Question Types', 'Required & Visible', 'Reordering'] },
  { id: 'conditional-logic', icon: GitBranch, label: 'Conditional Logic', sub: ['How it works', 'Operators', 'AND / OR'] },
  { id: 'design', icon: Palette, label: 'Design Studio', sub: ['Templates', 'Layout', 'Colours & Fonts', 'Live Preview'] },
  { id: 'translations', icon: Globe, label: 'Translations', sub: ['Adding languages', 'Translation mode', 'How it serves'] },
  { id: 'customer-data', icon: Database, label: 'Customer Data', sub: ['Metafield mapping', 'Using in Liquid', 'Shopify Flow', 'Email marketing'] },
  { id: 'analytics', icon: BarChart2, label: 'Analytics', sub: ['Completion rate', 'Funnel', 'Top answers'] },
  { id: 'integrations', icon: Webhook, label: 'Integrations', sub: ['Webhook setup', 'Payload reference', 'Zapier / Make'] },
  { id: 'ai-import', icon: Sparkles, label: 'AI & Import', sub: ['AI Flow Generator', 'CSV import', 'Plain text import'] },
  { id: 'faq', icon: HelpCircle, label: 'FAQ', sub: [] },
];

/* ── Helpers ─────────────────────────────────────────────────────── */
function Code({ children }: { children: string }) {
  return (
    <code className="px-1.5 py-0.5 rounded text-xs font-mono"
      style={{ background: `${CORAL}18`, color: CORAL }}>
      {children}
    </code>
  );
}

function CodeBlock({ children, lang = '' }: { children: string; lang?: string }) {
  return (
    <div className="rounded-xl border border-line overflow-hidden my-4">
      {lang && (
        <div className="px-4 py-2 border-b border-line bg-panel text-xs font-mono text-ink-dull flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-line inline-block" />
          {lang}
        </div>
      )}
      <pre className="p-5 text-xs font-mono leading-relaxed overflow-x-auto bg-page text-ink-dim whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

function Note({ type = 'info', children }: { type?: 'info' | 'warn'; children: React.ReactNode }) {
  const styles = type === 'warn'
    ? { borderColor: '#f59e0b66', bg: '#f59e0b0a', icon: <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#f59e0b' }} /> }
    : { borderColor: `${CORAL}55`, bg: `${CORAL}08`, icon: <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: CORAL }} /> };
  return (
    <div className="flex gap-3 p-4 rounded-xl border my-4 text-sm text-ink-dim leading-relaxed"
      style={{ borderColor: styles.borderColor, background: styles.bg }}>
      {styles.icon}
      <div>{children}</div>
    </div>
  );
}

function H2({ id, children }: { id: string; children: string }) {
  return <h2 id={id} className="text-2xl font-bold mt-14 mb-4 scroll-mt-24">{children}</h2>;
}

function H3({ children }: { children: string }) {
  return <h3 className="text-lg font-semibold mt-8 mb-3">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink-dim leading-relaxed mb-4">{children}</p>;
}

/* ── Component ─────────────────────────────────────────────────── */
export default function GreetDocs() {
  const [activeSection, setActiveSection] = useState('getting-started');

  return (
    <div className="min-h-screen bg-page text-ink">
      <Navbar />

      {/* Page header */}
      <div className="border-b border-line-sub py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/apps/greet" className="inline-flex items-center gap-2 text-sm text-ink-dim hover:text-ink transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Greet
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-6 h-6" style={{ color: CORAL }} />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim">Documentation</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Greet — Knowledge Base</h1>
          <p className="text-ink-dim text-lg">Everything you need to set up, customise, and get the most from Greet.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex gap-0 px-6">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 py-10 pr-8 sticky top-20 self-start max-h-[calc(100vh-80px)] overflow-y-auto">
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <div key={s.id}>
                <button
                  onClick={() => {
                    setActiveSection(s.id);
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left"
                  style={activeSection === s.id
                    ? { background: `${CORAL}14`, color: CORAL }
                    : { color: 'var(--_ink-dim)' }
                  }
                >
                  <s.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {s.label}
                </button>
                {s.sub.length > 0 && activeSection === s.id && (
                  <div className="ml-6 mt-0.5 space-y-0.5">
                    {s.sub.map((sub) => (
                      <div key={sub} className="flex items-center gap-1.5 px-2 py-1 text-xs text-ink-dull">
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        {sub}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="mt-10 pt-6 border-t border-line-sub">
            <p className="text-xs text-ink-dull mb-3">Need help?</p>
            <a href="mailto:hello@oylabs.co" className="text-xs text-ink-dim hover:text-ink transition-colors flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3" style={{ color: CORAL }} /> hello@oylabs.co
            </a>
            <Link href="/apps/greet" className="text-xs text-ink-dim hover:text-ink transition-colors flex items-center gap-1.5 mt-2">
              <ArrowRight className="w-3 h-3" style={{ color: CORAL }} /> App landing page
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 py-10 min-w-0 border-l border-line-sub pl-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >

            {/* ── Getting Started ── */}
            <H2 id="getting-started">Getting Started</H2>

            <H3>What is Greet?</H3>
            <P>
              <strong>Greet</strong> is a Shopify app that shows a beautiful, multi-step onboarding popup to logged-in customers. When customers fill it in, their answers are saved directly as <strong>Shopify customer metafields</strong> — giving you a rich profile of every customer, ready to use in Liquid, Shopify Flow, email marketing, and more.
            </P>

            <Note>
              Greet only shows to <strong>logged-in customers</strong> who haven't completed the flow. Once completed, the popup never shows again.
            </Note>

            <H3>Installation</H3>
            <P>Install Greet from the Shopify App Store. Approve the requested permissions:</P>
            <ul className="text-sm text-ink-dim space-y-2 mb-6 ml-4">
              {[
                'read_customers, write_customers — save answers to customer profiles',
                'read_metaobjects, write_metaobjects — store your flow configuration',
                'read_themes — check whether the App Embed is active',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: CORAL }} />
                  {item}
                </li>
              ))}
            </ul>

            <H3>Enable the App Embed</H3>
            <P>
              Greet is delivered as a <strong>Theme App Extension (App Embed)</strong>. You enable it once in the Theme Editor — no Liquid, no code, no developer.
            </P>
            <ol className="text-sm text-ink-dim space-y-2 mb-6 ml-4 list-decimal list-inside">
              <li>In the Greet admin, click <strong>"Open Theme Editor → App Embeds"</strong> in the banner</li>
              <li>In the Theme Editor that opens, find <strong>"Greet — Customer Onboarding"</strong></li>
              <li>Toggle it <strong>on</strong> and click <strong>Save</strong></li>
            </ol>
            <Note type="warn">The banner in the Greet admin detects whether the App Embed is enabled by reading your theme's <Code>config/settings_data.json</Code>. If you just toggled it on, reload the Greet admin to see the updated status.</Note>

            <H3>Quick Start</H3>
            <P>After enabling the App Embed:</P>
            <ol className="text-sm text-ink-dim space-y-3 mb-6 ml-4 list-decimal list-inside">
              <li>Click <strong>Add Step</strong> to create your first screen</li>
              <li>Inside the step, click <strong>Add question</strong> and choose a question type</li>
              <li>Click <strong>Turn flow on</strong> in the banner</li>
              <li>Log in as a test customer in your storefront — the popup appears!</li>
            </ol>

            {/* ── Flow Builder ── */}
            <H2 id="flow-builder">Flow Builder</H2>

            <H3>Steps</H3>
            <P>A <strong>step</strong> is one screen in the popup. Use multiple steps to group related questions.</P>
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="pb-3 pr-8 font-semibold text-ink">Action</th>
                    <th className="pb-3 font-semibold text-ink">How</th>
                  </tr>
                </thead>
                <tbody className="text-ink-dim">
                  {[
                    ['Add a step', 'Click Add step (top-right of Questions page)'],
                    ['Rename a step', 'Click the pencil ✏ next to the step title'],
                    ['Reorder steps', 'Use ↑ ↓ arrows on each step card'],
                    ['Delete a step', 'Click Delete — removes all questions inside'],
                    ['Move a question', 'Drag the ⠿ handle and drop onto a different step'],
                  ].map(([action, how]) => (
                    <tr key={action} className="border-b border-line-sub">
                      <td className="py-3 pr-8 font-medium text-ink">{action}</td>
                      <td className="py-3">{how}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <H3>Question Types</H3>
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="pb-3 pr-6 font-semibold text-ink">Type</th>
                    <th className="pb-3 pr-6 font-semibold text-ink">Best for</th>
                    <th className="pb-3 font-semibold text-ink">Saves as</th>
                  </tr>
                </thead>
                <tbody className="text-ink-dim">
                  {[
                    ['Short Text', 'Name, city, job title', 'single_line_text_field'],
                    ['Long Text', 'Open feedback', 'multi_line_text_field'],
                    ['Single Choice', 'Skin type, preference', 'single_line_text_field'],
                    ['Multiple Choice', 'Interests, goals', 'list.single_line_text_field'],
                    ['Dropdown', 'Country, age range', 'single_line_text_field'],
                    ['Number', 'Age, budget', 'number_integer'],
                    ['Date', 'Birthday, anniversary', 'date'],
                    ['Star Rating', 'NPS, satisfaction', 'number_integer'],
                    ['Yes / No', 'Has pets, trade customer', 'boolean'],
                  ].map(([type, best, saves]) => (
                    <tr key={type} className="border-b border-line-sub">
                      <td className="py-2.5 pr-6 font-medium text-ink">{type}</td>
                      <td className="py-2.5 pr-6">{best}</td>
                      <td className="py-2.5"><Code>{saves}</Code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <H3>Required & Visible</H3>
            <P>Each question has two toggles right on the question row:</P>
            <ul className="text-sm text-ink-dim space-y-2 mb-6 ml-4">
              <li><strong>Required</strong> — customer must answer before continuing</li>
              <li><strong>Visible</strong> — when unchecked, question is hidden from customers (draft mode) without being deleted</li>
            </ul>

            {/* ── Conditional Logic ── */}
            <H2 id="conditional-logic">Conditional Logic</H2>
            <P>Show or hide a question based on a previous answer. Conditions are evaluated in real time — questions appear and disappear as the customer answers.</P>

            <H3>How to add a condition</H3>
            <ol className="text-sm text-ink-dim space-y-2 mb-6 ml-4 list-decimal list-inside">
              <li>Click <strong>Edit</strong> on the question you want to conditionally show</li>
              <li>Open <strong>"Conditional logic — show this question only if…"</strong></li>
              <li>Click <strong>Add condition</strong></li>
              <li>Choose: <em>[source question] [operator] [value]</em></li>
            </ol>

            <H3>Available operators</H3>
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="pb-3 pr-8 font-semibold text-ink">Operator</th>
                    <th className="pb-3 font-semibold text-ink">Meaning</th>
                  </tr>
                </thead>
                <tbody className="text-ink-dim">
                  {[
                    ['equals', 'Answer exactly matches the value'],
                    ['does not equal', 'Answer is anything except the value'],
                    ['contains', 'Answer includes the text (case-insensitive)'],
                    ['does not contain', 'Answer does not include the text'],
                    ['is filled', 'Customer has entered any answer'],
                    ['is empty', "Customer hasn't answered yet"],
                  ].map(([op, meaning]) => (
                    <tr key={op} className="border-b border-line-sub">
                      <td className="py-2.5 pr-8 font-mono text-xs" style={{ color: CORAL }}>{op}</td>
                      <td className="py-2.5">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <H3>AND / OR logic</H3>
            <P>When you have multiple conditions, choose <strong>AND</strong> (all must be true) or <strong>OR</strong> (any must be true) using the logic selector.</P>

            {/* ── Design ── */}
            <H2 id="design">Design Studio</H2>
            <P>Open the <strong>Design</strong> tab to customise how the popup looks.</P>

            <H3>Templates</H3>
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="pb-3 pr-6 font-semibold text-ink">Template</th>
                    <th className="pb-3 pr-6 font-semibold text-ink">Style</th>
                    <th className="pb-3 font-semibold text-ink">Best for</th>
                  </tr>
                </thead>
                <tbody className="text-ink-dim">
                  {[
                    ['Executive Dark', 'Charcoal + gold, serif', 'Luxury, premium, high-end'],
                    ['Friendly Bloom', 'Coral + peach, rounded', 'Beauty, lifestyle, DTC'],
                    ['Editorial Minimal', 'Cream + ink, sharp corners', 'Fashion, editorial, creative'],
                    ['Aurora Glass', 'Dark frosted, violet/cyan', 'Tech, gaming, modern SaaS'],
                    ['Retro Terminal', 'Green-on-black, monospace', 'Streetwear, niche, collectors'],
                  ].map(([name, style, best]) => (
                    <tr key={name} className="border-b border-line-sub">
                      <td className="py-2.5 pr-6 font-medium text-ink">{name}</td>
                      <td className="py-2.5 pr-6">{style}</td>
                      <td className="py-2.5">{best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Note>Selecting a template sets all colours, fonts, corners, and button styles at once. You can then fine-tune any individual setting below it.</Note>

            <H3>Layout vs. Template</H3>
            <P>
              A <strong>template</strong> sets everything at once (colours + fonts + layout). A <strong>layout</strong> only changes the popup's shape (centered card, fullscreen, bubble, etc.) — it does <em>not</em> change your colours or fonts.
            </P>

            {/* ── Translations ── */}
            <H2 id="translations">Translations</H2>
            <P>Greet supports all languages enabled in your Shopify store.</P>
            <ol className="text-sm text-ink-dim space-y-2 mb-6 ml-4 list-decimal list-inside">
              <li>In Questions, find the <strong>"Editing language"</strong> dropdown</li>
              <li>Select a language (Arabic, French, German, etc.)</li>
              <li>The page switches to translation mode — enter translations for every step, question, and option</li>
              <li>Click <strong>Save</strong> next to each item</li>
            </ol>
            <P>On the storefront, Greet reads the customer's browser locale and serves the matching translation. Falls back to the default language if no translation exists.</P>

            {/* ── Customer Data ── */}
            <H2 id="customer-data">Customer Data</H2>

            <H3>Metafield mapping</H3>
            <P>Every question can be mapped to a Shopify customer metafield. Click <strong>Edit</strong> on any question → <strong>Customer metafield mapping</strong> to set the namespace and key.</P>

            <H3>Using in Liquid</H3>
            <CodeBlock lang="liquid">{
`{{ customer.metafields.customer_profile.skin_type.value }}
{{ customer.metafields.customer_profile.birthday.value }}

{%- assign done = customer.metafields.tafseel_onboarding.completed.value -%}
{% unless done %}
  {# Show upsell banner to customers who haven't completed onboarding #}
{% endunless %}`
            }</CodeBlock>

            <H3>Completion metafields (auto-set)</H3>
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="pb-3 pr-8 font-semibold text-ink">Metafield</th>
                    <th className="pb-3 font-semibold text-ink">Value</th>
                  </tr>
                </thead>
                <tbody className="text-ink-dim font-mono text-xs">
                  {[
                    ['tafseel_onboarding.completed', 'true'],
                    ['tafseel_onboarding.status', '"completed"'],
                    ['tafseel_onboarding.completed_at', 'ISO 8601 datetime'],
                    ['tafseel_onboarding.flow_id', 'The flow ID'],
                  ].map(([field, val]) => (
                    <tr key={field} className="border-b border-line-sub">
                      <td className="py-2.5 pr-8" style={{ color: CORAL }}>{field}</td>
                      <td className="py-2.5 text-ink-dim">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <H3>Shopify Flow</H3>
            <P>Create a Flow trigger on <strong>Customer updated</strong>, then check:</P>
            <CodeBlock lang="flow condition">{
`customer.metafields.customer_profile.skin_type = "Dry"
customer.metafields.tafseel_onboarding.completed = "true"`
            }</CodeBlock>
            <P>Actions: Send email / Apply tag / Apply discount / Create support ticket — anything Flow supports.</P>

            {/* ── Analytics ── */}
            <H2 id="analytics">Analytics</H2>
            <P>Open the <strong>Analytics</strong> tab to view submission data.</P>
            <ul className="text-sm text-ink-dim space-y-2 mb-6 ml-4">
              {[
                ['Total sessions', 'Number of times the popup was opened'],
                ['Completed', 'Customers who finished all steps'],
                ['Skipped', 'Customers who closed without finishing'],
                ['Completion rate', 'Completed ÷ Total × 100'],
                ['Step drop-off funnel', 'How far customers get before abandoning'],
                ['Top answers', 'Most common answers per question (last 500 submissions)'],
              ].map(([label, desc]) => (
                <li key={label} className="flex gap-2">
                  <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: CORAL }} />
                  <span><strong>{label}</strong> — {desc}</span>
                </li>
              ))}
            </ul>

            {/* ── Integrations ── */}
            <H2 id="integrations">Integrations & Webhooks</H2>

            <H3>Setup</H3>
            <ol className="text-sm text-ink-dim space-y-2 mb-6 ml-4 list-decimal list-inside">
              <li>In Questions, scroll to <strong>Integrations</strong> and toggle it open</li>
              <li>Enter your <strong>Webhook URL</strong></li>
              <li>Click <strong>Save</strong></li>
            </ol>

            <H3>Payload reference</H3>
            <CodeBlock lang="json">{
`{
  "event": "onboarding.completed",
  "shop": "your-store.myshopify.com",
  "customerId": "1234567890",
  "customerEmail": "jane@example.com",
  "customerName": "Jane Doe",
  "flowId": "abc123",
  "stepReached": 3,
  "totalSteps": 3,
  "skipped": false,
  "submittedAt": "2026-06-02T10:30:00.000Z",
  "answers": [
    { "namespace": "customer_profile", "key": "skin_type", "value": "Dry" },
    { "namespace": "customer_profile", "key": "birthday", "value": "1990-05-15" }
  ]
}`
            }</CodeBlock>
            <Note>Use <a href="https://webhook.site" target="_blank" rel="noreferrer" className="underline">webhook.site</a> to test and inspect the live payload before connecting a real integration.</Note>

            {/* ── AI & Import ── */}
            <H2 id="ai-import">AI & Bulk Import</H2>

            <H3>✨ AI Flow Generator</H3>
            <P>Click <strong>"✨ Generate with AI"</strong> in the Questions page header.</P>
            <ol className="text-sm text-ink-dim space-y-2 mb-4 ml-4 list-decimal list-inside">
              <li>Select your store type (Fashion, Beauty, B2B, etc.)</li>
              <li>Describe what you want to learn from customers</li>
              <li>Choose 1–4 steps</li>
              <li>Click Generate, preview the result, then Apply</li>
            </ol>
            <Note type="warn">Requires <Code>ANTHROPIC_API_KEY</Code> to be configured. Contact OY Labs to enable this feature.</Note>

            <H3>CSV Import</H3>
            <P>Click <strong>"⬆ Import"</strong> → CSV tab. Paste from Excel or Google Sheets:</P>
            <CodeBlock lang="csv">{
`Step Title,Question Label,Type,Options (;-separated),Metafield Key,Required
Welcome,What is your skin type?,SINGLE_CHOICE,Oily;Dry;Combination,skin_type,true
Welcome,Do you have any allergies?,TEXT,,allergies,false
Preferences,How did you hear about us?,SINGLE_CHOICE,Instagram;Friend;Google,referral_source,false`
            }</CodeBlock>
            <P>The first header row is ignored automatically. Supported types: <Code>TEXT</Code> <Code>SINGLE_CHOICE</Code> <Code>MULTIPLE_CHOICE</Code> <Code>YES_NO</Code> <Code>DATE</Code> <Code>NUMBER</Code> <Code>RATING</Code></P>

            {/* ── FAQ ── */}
            <H2 id="faq">Frequently Asked Questions</H2>
            <div className="space-y-4 mt-4">
              {[
                { q: 'Will the popup show on every page?', a: 'No. The popup only shows to logged-in customers who haven\'t completed the flow. Once completed, it never appears again.' },
                { q: 'Does it work with New Customer Accounts (passwordless)?', a: 'Yes. Greet is compatible with both Legacy and New Customer Accounts.' },
                { q: 'Is customer data stored outside Shopify?', a: 'No. All answers are saved as Shopify customer metafields inside your account. Flow configuration is stored as Shopify metaobjects. Submission analytics are stored in a Cloudflare D1 database tied to the app — no third-party sharing.' },
                { q: 'How many questions can I have?', a: 'No hard limit. Shopify allows up to 200 customer metafield definitions per store (shared across all apps). A typical Greet flow of 5–15 questions leaves plenty of headroom.' },
                { q: 'Can I have multiple flows?', a: 'The current version supports one active flow per store. Multiple flows (for different customer segments) is on the roadmap.' },
                { q: 'The popup is not showing — what do I check?', a: 'Check: (1) App Embed is toggled ON in Theme Editor → App Embeds, (2) Flow is turned ON in the Greet admin banner, (3) You are logged in as a customer who hasn\'t completed the flow, (4) The flow has at least one step with at least one question.' },
              ].map((faq) => (
                <div key={faq.q} className="rounded-xl border border-line p-6">
                  <p className="font-semibold mb-2">{faq.q}</p>
                  <p className="text-sm text-ink-dim leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>

            {/* Footer CTA */}
            <div
              className="mt-16 rounded-2xl border p-8 text-center"
              style={{ borderColor: `${CORAL}44`, background: `${CORAL}08` }}
            >
              <p className="font-bold text-lg mb-2">Still need help?</p>
              <p className="text-sm text-ink-dim mb-6">Our team at OY Labs is happy to help you get set up.</p>
              <div className="flex justify-center gap-4 flex-wrap">
                <a href="mailto:hello@oylabs.co"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white"
                  style={{ background: CORAL }}
                >
                  Email support
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link href="/apps/greet"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border border-line text-ink-dim hover:text-ink transition-colors"
                >
                  Back to Greet
                </Link>
              </div>
            </div>

          </motion.div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
