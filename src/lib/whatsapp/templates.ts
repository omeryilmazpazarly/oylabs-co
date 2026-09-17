import 'server-only';
import { getDb, now } from '@/lib/messaging/db';
import { SendError } from '@/lib/messaging/send-errors';
import { errorSummary, log } from '@/lib/log';
import { waTokenFor } from './numbers';
import * as wa from './graph';

/**
 * WhatsApp message templates: the local mirror of what Meta holds, plus
 * create/edit/delete. Templates belong to a WhatsApp Business Account, so
 * every connected number on that account shares them.
 */

export interface WaTemplate {
  id: number;
  workspace_id: number;
  waba_id: string;
  template_id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  parameter_format: string;
  components: TemplateComponent[];
  rejected_reason: string | null;
  updated_at: number;
}

export type TemplateComponent =
  | { type: 'HEADER'; format: 'TEXT'; text: string; example?: { header_text: string[] } }
  | { type: 'HEADER'; format: 'IMAGE' | 'VIDEO' | 'DOCUMENT'; example?: { header_handle: string[] } }
  | { type: 'BODY'; text: string; example?: { body_text?: string[][]; body_text_named_params?: { param_name: string; example: string }[] } }
  | { type: 'FOOTER'; text: string }
  | { type: 'BUTTONS'; buttons: TemplateButton[] };

export type TemplateButton =
  | { type: 'QUICK_REPLY'; text: string }
  | { type: 'URL'; text: string; url: string; example?: string[] }
  | { type: 'PHONE_NUMBER'; text: string; phone_number: string };

export interface TemplateDraft {
  wabaId: string;
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  header: { format: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'; text?: string; example?: string; handle?: string };
  body: { text: string; examples: string[] };
  footer?: string;
  buttons: TemplateButton[];
}

const NAME_RE = /^[a-z0-9_]{1,512}$/;
const LANGUAGE_RE = /^[a-z]{2,3}(_[A-Za-z]{2,4})?$/;

function fail(message: string): never {
  throw new SendError('template_invalid', message);
}

/** Variables are either {{1}}, {{2}}… (positional) or {{name}} (named); Meta does not allow mixing them. */
export function templateVariables(text: string): { format: 'positional' | 'named'; names: string[] } {
  const tokens = [...text.matchAll(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g)].map((m) => m[1]);
  const numeric = tokens.filter((t) => /^\d+$/.test(t));
  if (numeric.length && numeric.length !== tokens.length) fail('Use either numbered ({{1}}) or named ({{order_id}}) variables, not both.');
  if (!numeric.length) return { format: 'named', names: [...new Set(tokens)] };
  const unique = [...new Set(numeric)].map(Number).sort((a, b) => a - b);
  if (unique.some((n, i) => n !== i + 1)) fail('Numbered variables must run in order from {{1}} with no gaps.');
  return { format: 'positional', names: unique.map(String) };
}

/** Turns the editor's draft into Meta's components array, with the examples Meta requires for every variable. */
export function buildTemplateComponents(draft: TemplateDraft): { components: TemplateComponent[]; parameterFormat: 'POSITIONAL' | 'NAMED' } {
  if (!NAME_RE.test(draft.name)) fail('The template name may only use lowercase letters, numbers and underscores.');
  if (!LANGUAGE_RE.test(draft.language)) fail('Choose a language, for example en_US.');
  const bodyText = draft.body.text?.trim();
  if (!bodyText) fail('The message body is required.');
  if (bodyText.length > 1024) fail('The message body is limited to 1024 characters.');

  const components: TemplateComponent[] = [];
  const bodyVars = templateVariables(bodyText);
  const examples = draft.body.examples ?? [];
  if (bodyVars.names.length !== examples.filter((e) => e.trim()).length) {
    fail(`Give an example value for each of the ${bodyVars.names.length} variable(s) in the body.`);
  }

  if (draft.header.format === 'TEXT') {
    const text = draft.header.text?.trim();
    if (!text) fail('The header text is required.');
    if (text.length > 60) fail('The header text is limited to 60 characters.');
    const vars = templateVariables(text);
    if (vars.names.length > 1) fail('A header can hold at most one variable.');
    if (vars.names.length && !draft.header.example?.trim()) fail('Give an example value for the header variable.');
    components.push({ type: 'HEADER', format: 'TEXT', text, ...(vars.names.length ? { example: { header_text: [draft.header.example!.trim()] } } : {}) });
  } else if (draft.header.format !== 'NONE') {
    if (!draft.header.handle) fail('Upload an example file for the header.');
    components.push({ type: 'HEADER', format: draft.header.format, example: { header_handle: [draft.header.handle] } });
  }

  const bodyComponent: TemplateComponent = { type: 'BODY', text: bodyText };
  if (bodyVars.names.length) {
    bodyComponent.example = bodyVars.format === 'named'
      ? { body_text_named_params: bodyVars.names.map((name, i) => ({ param_name: name, example: examples[i].trim() })) }
      : { body_text: [bodyVars.names.map((_, i) => examples[i].trim())] };
  }
  components.push(bodyComponent);

  if (draft.footer?.trim()) {
    if (draft.footer.trim().length > 60) fail('The footer is limited to 60 characters.');
    components.push({ type: 'FOOTER', text: draft.footer.trim() });
  }

  const buttons = (draft.buttons ?? []).filter((b) => b.text?.trim());
  if (buttons.length) {
    if (buttons.length > 10) fail('A template can have at most 10 buttons.');
    if (buttons.filter((b) => b.type === 'URL').length > 2) fail('A template can have at most two link buttons.');
    if (buttons.filter((b) => b.type === 'PHONE_NUMBER').length > 1) fail('A template can have at most one call button.');
    for (const button of buttons) {
      if (button.text.length > 25) fail('Button labels are limited to 25 characters.');
      if (button.type === 'URL') {
        if (!/^https:\/\//.test(button.url ?? '')) fail('Link buttons need an https URL.');
        const vars = templateVariables(button.url);
        if (vars.names.length > 1) fail('A link button can hold at most one variable.');
        if (vars.names.length && !button.example?.[0]) fail('Give an example value for the link button variable.');
      }
      if (button.type === 'PHONE_NUMBER' && !/^\+?\d{7,20}$/.test(button.phone_number ?? '')) fail('Call buttons need a phone number in international format.');
    }
    // Meta requires quick replies to be grouped together, before the other buttons.
    components.push({ type: 'BUTTONS', buttons: [...buttons.filter((b) => b.type === 'QUICK_REPLY'), ...buttons.filter((b) => b.type !== 'QUICK_REPLY')] });
  }

  return { components, parameterFormat: bodyVars.format === 'named' ? 'NAMED' : 'POSITIONAL' };
}

function parseTemplate(row: Omit<WaTemplate, 'components'> & { components: string }): WaTemplate {
  return { ...row, components: JSON.parse(row.components) as TemplateComponent[] };
}

export function listTemplates(workspaceId: number, opts: { wabaId?: string; approvedOnly?: boolean } = {}): WaTemplate[] {
  const rows = getDb().prepare(`
    SELECT * FROM wa_templates WHERE workspace_id = ?
    ${opts.wabaId ? 'AND waba_id = ?' : ''} ${opts.approvedOnly ? "AND status = 'APPROVED'" : ''}
    ORDER BY name, language
  `).all(...(opts.wabaId ? [workspaceId, opts.wabaId] : [workspaceId])) as (Omit<WaTemplate, 'components'> & { components: string })[];
  return rows.map(parseTemplate);
}

export function getTemplate(workspaceId: number, id: number): WaTemplate | null {
  const row = getDb().prepare('SELECT * FROM wa_templates WHERE workspace_id = ? AND id = ?').get(workspaceId, id) as (Omit<WaTemplate, 'components'> & { components: string }) | undefined;
  return row ? parseTemplate(row) : null;
}

/** A connected, still-authorised number on that WhatsApp Business Account provides the token. */
function tokenForWaba(workspaceId: number, wabaId: string): string {
  const row = getDb().prepare(`SELECT id FROM wa_numbers WHERE workspace_id = ? AND waba_id = ? AND status != 'disconnected' AND token_enc IS NOT NULL`).get(workspaceId, wabaId) as { id: number } | undefined;
  const token = row ? waTokenFor(row.id) : null;
  if (!token) throw new SendError('reconnect_needed', 'This WhatsApp account needs to be reconnected before templates can be managed.');
  return token;
}

/** Replaces the local mirror for each connected WhatsApp Business Account. */
export async function syncTemplates(workspaceId: number): Promise<number> {
  const db = getDb();
  const wabas = db.prepare(`SELECT DISTINCT waba_id FROM wa_numbers WHERE workspace_id = ? AND status != 'disconnected'`).all(workspaceId) as { waba_id: string }[];
  let total = 0;
  for (const { waba_id: wabaId } of wabas) {
    let remote: wa.MetaTemplate[];
    try {
      remote = await wa.listTemplates(wabaId, tokenForWaba(workspaceId, wabaId));
    } catch (err) {
      log.warn('whatsapp.templates.sync_failed', { workspaceId, wabaId, error: errorSummary(err) });
      continue;
    }
    const t = now();
    db.transaction(() => {
      const upsert = db.prepare(`
        INSERT INTO wa_templates (workspace_id, waba_id, template_id, name, language, category, status, parameter_format, components, rejected_reason, updated_at)
        VALUES (@workspaceId, @wabaId, @templateId, @name, @language, @category, @status, @parameterFormat, @components, @rejectedReason, @t)
        ON CONFLICT(template_id) DO UPDATE SET name = excluded.name, language = excluded.language, category = excluded.category,
          status = excluded.status, parameter_format = excluded.parameter_format, components = excluded.components,
          rejected_reason = excluded.rejected_reason, updated_at = excluded.updated_at
      `);
      for (const item of remote) {
        upsert.run({
          workspaceId, wabaId, templateId: String(item.id), name: item.name, language: item.language, category: item.category,
          status: item.status, parameterFormat: (item.parameter_format ?? 'POSITIONAL').toLowerCase(),
          components: JSON.stringify(item.components ?? []), rejectedReason: item.rejected_reason && item.rejected_reason !== 'NONE' ? item.rejected_reason : null, t,
        });
      }
      // Templates deleted in WhatsApp Manager disappear from the list.
      db.prepare(`DELETE FROM wa_templates WHERE workspace_id = ? AND waba_id = ? AND updated_at < ?`).run(workspaceId, wabaId, t);
    })();
    total += remote.length;
  }
  return total;
}

export async function createTemplate(workspaceId: number, draft: TemplateDraft, sample?: { name: string; type: string; bytes: Buffer }): Promise<WaTemplate> {
  const token = tokenForWaba(workspaceId, draft.wabaId);
  if (draft.header.format !== 'NONE' && draft.header.format !== 'TEXT' && sample) {
    draft = { ...draft, header: { ...draft.header, handle: await wa.uploadTemplateSample(token, sample) } };
  }
  const { components, parameterFormat } = buildTemplateComponents(draft);
  const created = await wa.createTemplate(draft.wabaId, token, {
    name: draft.name, language: draft.language, category: draft.category, parameter_format: parameterFormat, components,
  });
  const db = getDb();
  db.prepare(`
    INSERT INTO wa_templates (workspace_id, waba_id, template_id, name, language, category, status, parameter_format, components, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(template_id) DO UPDATE SET status = excluded.status, components = excluded.components, updated_at = excluded.updated_at
  `).run(workspaceId, draft.wabaId, String(created.id), draft.name, draft.language, created.category ?? draft.category,
    created.status ?? 'PENDING', parameterFormat.toLowerCase(), JSON.stringify(components), now());
  log.info('whatsapp.template.created', { workspaceId, name: draft.name });
  return getDb().prepare('SELECT * FROM wa_templates WHERE template_id = ?').get(String(created.id)) as WaTemplate;
}

export async function updateTemplate(workspaceId: number, id: number, draft: TemplateDraft, sample?: { name: string; type: string; bytes: Buffer }): Promise<void> {
  const existing = getTemplate(workspaceId, id);
  if (!existing) fail('Template not found.');
  const token = tokenForWaba(workspaceId, existing.waba_id);
  if (draft.header.format !== 'NONE' && draft.header.format !== 'TEXT' && sample) {
    draft = { ...draft, header: { ...draft.header, handle: await wa.uploadTemplateSample(token, sample) } };
  }
  const { components } = buildTemplateComponents({ ...draft, name: existing.name, language: existing.language });
  // Meta rejects a category change on an approved template.
  await wa.editTemplate(existing.template_id, token, {
    components, ...(existing.status === 'APPROVED' ? {} : { category: draft.category }),
  });
  getDb().prepare('UPDATE wa_templates SET components = ?, category = ?, status = ?, rejected_reason = NULL, updated_at = ? WHERE id = ?')
    .run(JSON.stringify(components), existing.status === 'APPROVED' ? existing.category : draft.category, 'PENDING', now(), id);
  log.info('whatsapp.template.updated', { workspaceId, id });
}

export async function deleteTemplate(workspaceId: number, id: number): Promise<void> {
  const existing = getTemplate(workspaceId, id);
  if (!existing) return;
  await wa.deleteTemplate(existing.waba_id, tokenForWaba(workspaceId, existing.waba_id), existing.name, existing.template_id);
  getDb().prepare('DELETE FROM wa_templates WHERE id = ?').run(id);
  log.info('whatsapp.template.deleted', { workspaceId, id });
}

/** Variables a sender has to fill in: the header variable (or media), body variables and any link-button variable. */
export function templateFormFields(template: WaTemplate): { header: 'none' | 'text' | 'media'; headerFormat?: string; bodyVariables: string[]; urlVariable: boolean } {
  const header = template.components.find((c) => c.type === 'HEADER') as Extract<TemplateComponent, { type: 'HEADER' }> | undefined;
  const body = template.components.find((c) => c.type === 'BODY') as Extract<TemplateComponent, { type: 'BODY' }> | undefined;
  const buttons = (template.components.find((c) => c.type === 'BUTTONS') as Extract<TemplateComponent, { type: 'BUTTONS' }> | undefined)?.buttons ?? [];
  const headerVars = header?.format === 'TEXT' ? templateVariables(header.text).names : [];
  return {
    header: !header ? 'none' : header.format === 'TEXT' ? (headerVars.length ? 'text' : 'none') : 'media',
    headerFormat: header?.format,
    bodyVariables: body ? templateVariables(body.text).names : [],
    urlVariable: buttons.some((b) => b.type === 'URL' && /\{\{/.test(b.url)),
  };
}

/** Builds the components Meta expects when sending, from the values typed into the send form. */
export function buildSendComponents(template: WaTemplate, values: { header?: string; body?: string[]; url?: string }): unknown[] {
  const fields = templateFormFields(template);
  const named = template.parameter_format === 'named';
  const components: unknown[] = [];
  if (fields.header === 'text' && values.header) {
    components.push({ type: 'header', parameters: [{ type: 'text', text: values.header }] });
  } else if (fields.header === 'media' && values.header) {
    const format = (fields.headerFormat ?? 'IMAGE').toLowerCase();
    components.push({ type: 'header', parameters: [{ type: format, [format]: { link: values.header } }] });
  }
  if (fields.bodyVariables.length) {
    components.push({
      type: 'body',
      parameters: fields.bodyVariables.map((name, i) => (named
        ? { type: 'text', parameter_name: name, text: values.body?.[i] ?? '' }
        : { type: 'text', text: values.body?.[i] ?? '' })),
    });
  }
  if (fields.urlVariable && values.url) {
    const buttons = (template.components.find((c) => c.type === 'BUTTONS') as Extract<TemplateComponent, { type: 'BUTTONS' }>).buttons;
    components.push({ type: 'button', sub_type: 'url', index: String(buttons.findIndex((b) => b.type === 'URL' && /\{\{/.test(b.url))), parameters: [{ type: 'text', text: values.url }] });
  }
  return components;
}

/** Approved templates in the shape the send form needs. */
export function sendableTemplates(workspaceId: number) {
  return listTemplates(workspaceId, { approvedOnly: true }).map((t) => {
    const body = t.components.find((c) => c.type === 'BODY') as { text?: string } | undefined;
    const fields = templateFormFields(t);
    return {
      id: t.id, name: t.name, language: t.language, bodyPreview: body?.text ?? '',
      header: fields.header, headerFormat: fields.headerFormat, bodyVariables: fields.bodyVariables, urlVariable: fields.urlVariable,
    };
  });
}
