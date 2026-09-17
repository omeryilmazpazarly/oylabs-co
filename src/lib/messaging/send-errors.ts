/* Shared by the Messenger/Instagram and WhatsApp send paths. */

export type SendErrorCode =
  | 'invalid_request'
  | 'page_id_required'
  | 'connection_not_found'
  | 'reconnect_needed'
  | 'conversation_not_found'
  | 'outside_messaging_window'
  | 'human_agent_not_approved'
  | 'meta_rate_limited'
  | 'subscription_inactive'
  | 'template_invalid'
  | 'meta_error';

const HTTP_STATUS: Record<SendErrorCode, number> = {
  invalid_request: 400,
  page_id_required: 400,
  connection_not_found: 404,
  conversation_not_found: 404,
  reconnect_needed: 409,
  outside_messaging_window: 422,
  human_agent_not_approved: 422,
  meta_rate_limited: 429,
  subscription_inactive: 402,
  template_invalid: 400,
  meta_error: 502,
};

export class SendError extends Error {
  readonly status: number;
  constructor(public readonly code: SendErrorCode, message: string, public readonly metaCode?: number) {
    super(message);
    this.name = 'SendError';
    this.status = HTTP_STATUS[code];
  }
}
