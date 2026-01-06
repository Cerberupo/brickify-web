/**
 * Build LEGO Pick a Brick URL for a given store/element id and locale.
 * - EN → en-us
 * - ES → es-es
 * Returns null if the id is empty/invalid.
 */
export function buildPickABrickUrl(storeId: string | number | null | undefined, locale: 'en' | 'es'): string | null {
    if (storeId === null || storeId === undefined) return null;
    const id = String(storeId).trim();
    if (!id || id === '0' || /[^0-9]/.test(id)) {
        // For now only accept numeric IDs typically used as element/store ids
        return null;
    }
    const langRegion = locale === 'es' ? 'es-es' : 'en-us';
    return `https://www.lego.com/${langRegion}/pick-and-build/pick-a-brick?query=${encodeURIComponent(id)}`;
}
