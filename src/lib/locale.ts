export type SupportedLocale = 'en' | 'es';

/**
 * Normalize any incoming locale (e.g. "en", "en-US", "es-ES")
 * to one of our supported app locales.
 *
 * Defaults to English ("en").
 */
export function normalizeLocale(input?: string | null): SupportedLocale {
  if (!input) return 'en';
  const code = String(input).toLowerCase();
  return code.startsWith('es') ? 'es' : 'en';
}
