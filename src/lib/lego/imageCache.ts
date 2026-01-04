/**
 * Cache de URLs de imágenes para evitar recargas innecesarias durante polling.
 * Mantiene una URL estable por clave lógica con TTL e invalidación por error de carga.
 */

export type ImageCacheKey = string; // e.g. `piece:ID:front` | `person:ID` | normalized url

type Entry = {
    url: string;
    ts: number; // timestamp guardado
};

const CACHE = new Map<ImageCacheKey, Entry>();

// TTL por defecto: 20 minutos
const DEFAULT_TTL_MS = 20 * 60 * 1000;

// URLs que nunca deberíamos cachear (placeholders genéricos locales o siluetas)
const NEVER_CACHE_RE = /(^|\/)piece-2\.svg$/i;

/** Normaliza una URL a una clave estable sin query ni hash y sin origen */
export function makeUrlKey(url: string | null | undefined): string {
    const u = (url || '').toString();
    if (!u) return '';
    try {
        // Soporta rutas relativas y absolutas
        const abs = u.startsWith('http') ? new URL(u) : new URL(u, typeof window !== 'undefined' ? window.location.origin : 'https://local');
        return abs.pathname;
    } catch {
        // Si falla, devolver como está sin query/hash si se puede
        return u.split('#')[0]?.split('?')[0] || u;
    }
}

/** Normaliza una clave lógica */
export function makePieceKey(pieceId: string | number, side: 'front' | 'back'): ImageCacheKey {
    return `piece:${pieceId}:${side}`;
}

export function makePersonKey(personId: string | number): ImageCacheKey {
    return `person:${personId}`;
}

/** Devuelve una URL "estable":
 * - Si ya hay una almacenada y no ha expirado el TTL, se devuelve la anterior
 * - Si no hay o expiró, se guarda y devuelve la nueva (`nextUrl`)
 * - Nunca cachea placeholders genéricos (piece-2.svg)
 */
export function getStableImageSrc(key: ImageCacheKey, nextUrl: string | null | undefined, opts?: {
    ttlMs?: number
}): string | undefined {
    const url = (nextUrl || '').toString();
    if (!url) return undefined;
    if (NEVER_CACHE_RE.test(url)) return url; // no cachear, devolver tal cual

    const ttl = Math.max(5_000, opts?.ttlMs ?? DEFAULT_TTL_MS);
    const now = Date.now();
    const entry = CACHE.get(key);
    if (entry) {
        const age = now - entry.ts;
        if (age <= ttl) {
            // Mantener URL anterior para evitar nueva descarga
            return entry.url;
        }
    }
    // Actualizar cache
    CACHE.set(key, {url, ts: now});
    return url;
}

/** Invalida una entrada (p.ej. en error de carga) para permitir refrescar en el próximo render */
export function invalidateImage(key: ImageCacheKey): void {
    CACHE.delete(key);
}

/** Purga entradas antiguas para limitar memoria */
export function purgeStale(ttlMs: number = DEFAULT_TTL_MS): void {
    const now = Date.now();
    for (const [k, e] of CACHE.entries()) {
        if (now - e.ts > ttlMs * 2) {
            CACHE.delete(k);
        }
    }
}

// Purga ocasional (cada 2 min) en background mientras exista la pestaña
let timer: number | null = null;
if (typeof window !== 'undefined' && !timer) {
    timer = window.setInterval(() => purgeStale(), 120_000);
    window.addEventListener('beforeunload', () => {
        if (timer) window.clearInterval(timer);
        timer = null;
    }, {once: true});
}
