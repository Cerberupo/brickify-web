import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import type {MatchPart} from "@/lib";
import {setSelectedPiece} from '@/lib/services/groups';
import {getStableImageSrc, invalidateImage, makePieceKey} from '@/lib/lego/imageCache';
import {buildPickABrickUrl} from '@/lib/lego/pab';
import {getCurrentLocale} from '@/lib/localeLinks';

const faviconUrl: string = '/favicon.png';

export interface PartPiecesProps {
    groupId: string;
    personId: string;
    part: MatchPart;
    data: any;
    onSelectedChange?: (part: MatchPart, pieceId: string | null) => void;
    /** Lado a mostrar para las imágenes (frontal/trasera). Default: 'front' */
    side?: 'front' | 'back';
}

export function PartPieces({groupId, personId, part, data, onSelectedChange, side = 'front'}: PartPiecesProps) {
    useTranslation();
    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
    const initializedRef = useRef(false);
    const savingRef = useRef(false);
    const pieces = Array.isArray((data as any)?.matchedPieceIds) ? (data as any).matchedPieceIds : [];
    const status = String((data as any)?.status || '').toLowerCase();

    const normalizeId = (p: any): string | null => {
        const id = p?.id || p?._id || p?.pieceId;
        return id ? String(id) : null;
    };

    const serverSelectedRaw: any = (data as any)?.selectedPiece;
    const serverSelectedId: string | null = typeof serverSelectedRaw === 'string'
        ? serverSelectedRaw
        : (serverSelectedRaw ? normalizeId(serverSelectedRaw) : null);

    useEffect(() => {
        if (status !== 'done' || pieces.length === 0) return;

        if (serverSelectedId) {
            initializedRef.current = true;
            setSelectedPieceId(serverSelectedId);
            if (onSelectedChange) onSelectedChange(part, serverSelectedId);
            return;
        }

        if (!initializedRef.current) {
            const first = pieces[0];
            const id = normalizeId(first);
            if (id) {
                initializedRef.current = true;
                setSelectedPieceId(id);
                if (onSelectedChange) onSelectedChange(part, id);
            }
        }
    }, [status, pieces, serverSelectedId, groupId, personId, part]);

    const handlePieceClick = useCallback((pid: string) => {
        // Evitar llamadas innecesarias si se hace click sobre la misma pieza
        if (pid === selectedPieceId) return;
        setSelectedPieceId(pid);
        if (onSelectedChange) onSelectedChange(part, pid);
        // Realizar la llamada al backend en el onClick, no en efectos/parent
        (async () => {
            if (savingRef.current) return;
            savingRef.current = true;
            try {
                await setSelectedPiece(groupId, personId, part, pid);
            } catch (e) {
                // Silenciar error para no molestar; la UI mantiene la selección local.
                // Puedes reemplazar por un toast si se desea notificar.
                // console.error('No se pudo guardar la pieza seleccionada', e);
            } finally {
                savingRef.current = false;
            }
        })();
    }, [groupId, personId, part, onSelectedChange, selectedPieceId]);

    if (status !== 'done' || pieces.length === 0) return null;

    // Filtrar piezas que no tengan ambas imágenes requeridas
    const renderablePieces = pieces.filter((p: any) => p?.imageFrontUrl && p?.imageBackUrl);

    if (renderablePieces.length === 0) return null;

    // Locale actual (en/es) para construir la URL de Pick a Brick
    const locale = getCurrentLocale();

    return (
        <div className="flex flex-wrap">
            {renderablePieces.map((piece: any, idx: number) => {
                const hasBoth = Boolean(piece?.imageFrontUrl && piece?.imageBackUrl);
                if (!hasBoth) return null;
                const imgSrc = side === 'back' ? piece.imageBackUrl : piece.imageFrontUrl;
                const storeId = piece?.storePieceId || piece?.elementId || '-';
                const pieceName = piece?.name || '';
                const pid = normalizeId(piece) || String(idx);
                const isSelected = selectedPieceId === pid;
                const cacheKey = makePieceKey(pid, side);
                // Si falla la carga con el src estable (que puede intentar CORS si el navegador lo cacheó así)
                // forzamos el src original.
                const stableSrc = getStableImageSrc(cacheKey, imgSrc) || imgSrc;
                const pabUrl = buildPickABrickUrl(piece?.storePieceId || piece?.elementId || null, locale);
                const pabLabel = locale === 'es' ? 'Ver en Pick a Brick' : 'View on Pick a Brick';
                return (
                    <div key={pid} className="relative text-left max-w-[100px] w-1/3 p-1">
                        <button
                            type="button"
                            onClick={() => handlePieceClick(String(pid))}
                            className="w-full cursor-pointer focus:outline-none"
                            title={pieceName}
                        >
                            <div
                                className={`aspect-square w-full overflow-hidden rounded border bg-white p-2 transition-colors duration-150 ${isSelected ? 'border-black' : 'border-gray-300 hover:border-gray-500'} hover:shadow-sm`}>
                                <img
                                    src={stableSrc}
                                    alt={pieceName || String(part)}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        invalidateImage(cacheKey);
                                        const target = e.currentTarget as HTMLImageElement;
                                        if (target.getAttribute('crossorigin') === 'anonymous') {
                                            target.removeAttribute('crossorigin');
                                            target.src = imgSrc;
                                        }
                                    }}
                                />
                            </div>
                        </button>
                        {pabUrl && (
                            <a
                                href={pabUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${pabLabel}: ${pieceName}`}
                                title={pabLabel}
                                className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white border border-neutral-200 shadow hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                     className="w-3 h-3 text-neutral-700" fill="currentColor" aria-hidden="true">
                                    <path
                                        d="M4 8.5A2.5 2.5 0 0 1 6.5 6H9V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1h2.5A2.5 2.5 0 0 1 20 8.5V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5Zm2.5-.5A.5.5 0 0 0 6 8.5V10h12V8.5a.5.5 0 0 0-.5-.5H6.5ZM10 6h4V5h-4v1Z"/>
                                </svg>
                            </a>
                        )}
                        <div className="mt-1 text-[10px] leading-tight text-gray-600 truncate">{pieceName}</div>
                        <div className="text-[10px] text-gray-500 truncate" title={String(storeId)}>
                            {storeId}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
