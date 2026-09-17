export type FormResult = { status: 'idle' } | { status: 'error'; message: string } | { status: 'ok'; message: string };
export type SecretState = { status: 'idle' } | { status: 'error'; message: string } | { status: 'rotated'; secret: string };
export type LinkState = { status: 'idle' } | { status: 'error'; message: string } | { status: 'created'; url: string; expiresAt: number };
export type FormAction<S> = (prev: S, formData: FormData) => Promise<S>;
export type PlainAction = (formData: FormData) => Promise<void>;
