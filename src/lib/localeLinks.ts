import {type SupportedLocale} from '@/lib/locale';

/**
 * Detect active locale from current URL path or <html lang>.
 * Falls back to 'en' if not available (SSR-safe when no window exists).
 */
export function getCurrentLocale(): SupportedLocale {
    // SSR-safe: try document first (Astro sets <html lang>), then path, then default
    if (typeof document !== 'undefined') {
        const lang = (document.documentElement?.lang || '').toLowerCase();
        if (lang === 'es' || lang === 'en') return lang as SupportedLocale;
    }
    if (typeof window !== 'undefined') {
        const seg = window.location.pathname.split('/')[1]?.toLowerCase();
        if (seg === 'es' || seg === 'en') return seg as SupportedLocale;
    }
    return 'en';
}

/** Replace or prepend locale prefix for a given path using provided locale (default: current). */
export function localizePath(path: string, locale?: SupportedLocale): string {
    const loc: SupportedLocale = locale ?? getCurrentLocale();
    if (!path) return loc === 'es' ? '/es' : '/en';

    // Ensure leading slash
    let p = path.startsWith('/') ? path : `/${path}`;

    // Remove any existing locale prefix
    if (p.startsWith('/es/')) p = p.substring(3); // remove '/es'
    else if (p === '/es') p = '/';
    else if (p.startsWith('/en/')) p = p.substring(3);
    else if (p === '/en') p = '/';

    // Avoid duplicating leading slashes
    if (!p.startsWith('/')) p = `/${p}`;

    // Root handling
    if (p === '/') return loc === 'es' ? '/es' : '/en';

    // Join
    return `/${loc}${p}`.replace(/\/+/, '/');
}

/** Get home href for current (or provided) locale */
export function homeHref(locale?: SupportedLocale): string {
    const loc = locale ?? getCurrentLocale();
    return loc === 'es' ? '/es' : '/en';
}

export function loginHref(locale?: SupportedLocale): string {
    return localizePath('/login/', locale);
}

export function registerHref(locale?: SupportedLocale): string {
    return localizePath('/register/', locale);
}

export function contactHref(locale?: SupportedLocale): string {
    return localizePath('/contact/', locale);
}

export function legalHref(locale?: SupportedLocale): string {
    return localizePath('/legal/', locale);
}

export function privacyHref(locale?: SupportedLocale): string {
    return localizePath('/privacy/', locale);
}

export function refundHref(locale?: SupportedLocale): string {
    return localizePath('/refund-policy/', locale);
}

/** Swap current URL to target locale, keeping the rest of the path after the locale, including query and hash. */
export function switchToLocale(target: SupportedLocale, currentPath?: string): string {
    // Build a full reference string including pathname + search + hash
    let full: string;
    if (typeof window !== 'undefined') {
        full = (currentPath ?? (window.location.pathname + window.location.search + window.location.hash)) || '/';
    } else {
        full = (currentPath || '/') as string;
    }

    // Separate into pathname, search and hash
    let hash = '';
    let search = '';
    let pathname = full;
    const hashIdx = pathname.indexOf('#');
    if (hashIdx >= 0) {
        hash = pathname.substring(hashIdx);
        pathname = pathname.substring(0, hashIdx);
    }
    const qIdx = pathname.indexOf('?');
    if (qIdx >= 0) {
        search = pathname.substring(qIdx);
        pathname = pathname.substring(0, qIdx);
    }

    // Normalize incoming like '/es/xxx' or '/en/xxx' or '/xxx'
    const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
    let rest = normalized;
    if (normalized.startsWith('/es/')) rest = normalized.substring(3); // keep leading '/'
    else if (normalized === '/es') rest = '/';
    else if (normalized.startsWith('/en/')) rest = normalized.substring(3);
    else if (normalized === '/en') rest = '/';

    // Compose localized path and re-append search/hash
    const base = (rest === '/') ? (target === 'es' ? '/es' : '/en') : `/${target}${rest}`;

    return `${base}${search}${hash}`;
}
