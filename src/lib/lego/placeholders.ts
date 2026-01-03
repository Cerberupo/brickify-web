export type LegoCategory = 'hair' | 'head' | 'body' | 'pants';

// Placeholders por categoría (rutas públicas)
export const EMPTY_BY_CAT: Record<LegoCategory, string> = {
    hair: '/preview/hair-empty.png',
    head: '/preview/head-empty.png',
    body: '/preview/body-empty.png',
    pants: '/preview/pants-empty.png',
};

/**
 * Detecta si la URL corresponde al placeholder genérico (silueta) que debemos tratar como "sin imagen".
 * Cubre cualquier ruta donde el nombre de archivo final sea piece-2.svg
 */
export function isGenericPlaceholder(url?: string | null): boolean {
    if (!url) return true;
    const u = String(url).trim();
    if (!u) return true;
    return /(^|\/)piece-2\.svg$/i.test(u);
}
