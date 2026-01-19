const INLINE_SECRETS_ALLOWED = import.meta.env.VITE_ALLOW_INLINE_SECRETS === 'true';
const SECRET_REF_PREFIXES = ['env:', 'file:', 'secret:'];

export function isInlineSecretAllowed(): boolean {
  return INLINE_SECRETS_ALLOWED;
}

export function isSecretReference(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return SECRET_REF_PREFIXES.some(prefix => trimmed.startsWith(prefix));
}
