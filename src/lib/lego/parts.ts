import type {SideImages} from '@/components/lego/LegoComposite';
import {EMPTY_BY_CAT, isGenericPlaceholder, type LegoCategory} from './placeholders';

export type {LegoCategory};

/**
 * Devuelve `{front, back}` para `LegoComposite` aplicando fallbacks por categoría
 * cuando falten URLs o cuando sean el placeholder genérico.
 */
export function toSideWithFallback(category: LegoCategory, item: any | null | undefined): SideImages {
    const empty = EMPTY_BY_CAT[category];
    if (!item) return {front: empty, back: empty};
    const front = !isGenericPlaceholder(item?.imageUrl || item?.imageFrontUrl)
        ? (item?.imageUrl || item?.imageFrontUrl)
        : empty;
    const backCandidate = item?.imageUrlBack || item?.imageBackUrl || item?.imageUrl || item?.imageFrontUrl;
    const back = !isGenericPlaceholder(backCandidate) ? backCandidate : empty;
    return {front, back};
}

/** Obtiene src para miniaturas según lado con fallback por categoría. */
export function thumbSrcFor(category: LegoCategory, item: any, side: 'front' | 'back'): string {
    const empty = EMPTY_BY_CAT[category];
    if (!item) return empty;
    const front = item?.imageUrl || item?.imageFrontUrl;
    const back = item?.imageUrlBack || item?.imageBackUrl || front;
    const s = side === 'back' ? back : front;
    return !isGenericPlaceholder(s) ? s : empty;
}

/** Construye opciones a partir de `matches` del backend para el grid de selección. */
export function mapMatchesToOptions(matches: any, locale: 'en' | 'es') {
    const placeholderName = locale === 'es' ? 'Cargando…' : 'Loading…';
    const placeholderUrl = '/piece-2.svg';

    const getItems = (arr: any[] | undefined | null) => {
        if (!arr || !Array.isArray(arr) || arr.length === 0) return [{
            id: 0,
            name: placeholderName,
            imageUrl: placeholderUrl
        }];
        const filtered = arr.filter((p: any) => (p?.imageFrontUrl || p?.imageUrl) && (p?.imageBackUrl || p?.imageUrlBack));
        if (filtered.length === 0) return [{id: 0, name: placeholderName, imageUrl: placeholderUrl}];
        return filtered.map((p: any, idx: number) => {
            const idNum = Number(p?.storePieceId) || Number(p?.id) || idx + 1;
            return {
                id: idNum,
                name: String(p?.name || `Piece ${idx + 1}`),
                imageUrl: String(p?.imageFrontUrl || p?.imageUrl),
                imageUrlBack: String(p?.imageBackUrl || p?.imageUrlBack || p?.imageFrontUrl || p?.imageUrl),
            };
        });
    };

    const byCat = (key: string) => {
        const cat = matches?.[key];
        if (!cat || cat.status !== 'done') return [{id: 0, name: placeholderName, imageUrl: placeholderUrl}];
        return getItems(cat.matchedPieceIds);
    };

    return {
        hair: byCat('wig'),
        head: byCat('head'),
        body: byCat('upperPart'),
        pants: byCat('lowerPart'),
    } as Record<LegoCategory, any[]>;
}

/** Deriva el estado por categoría (hair/head/body/pants) desde matches del backend. */
export function deriveCategoryStatuses(matches: Record<string, any> | undefined | null): Partial<Record<LegoCategory, string | null>> {
    try {
        const get = (k: string) => {
            const s = String(matches?.[k]?.status || '').toLowerCase();
            return s ? s : null;
        };
        return {
            hair: matches ? get('wig') : null,
            head: matches ? get('head') : null,
            body: matches ? get('upperPart') : null,
            pants: matches ? get('lowerPart') : null,
        };
    } catch {
        return {};
    }
}
