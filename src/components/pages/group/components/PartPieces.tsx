import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
const faviconUrl: string = '/favicon.png';

export interface PartPiecesProps {
  groupId: string;
  personId: string;
  part: MatchPart;
  data: any;
  onSelectedChange?: (part: MatchPart, pieceId: string | null) => void;
}

export function PartPieces({ groupId, personId, part, data, onSelectedChange }: PartPiecesProps) {
  useTranslation();
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const initializedRef = useRef(false);
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
        setSelectedPiece(groupId, personId, part, id).catch(() => {
          // ignore errors to avoid blocking UI
        });
      }
    }
  }, [status, pieces, serverSelectedId, groupId, personId, part]);

  const handlePieceClick = useCallback((pid: string) => {
    setSelectedPieceId(pid);
    if (onSelectedChange) onSelectedChange(part, pid);
    setSelectedPiece(groupId, personId, part, String(pid)).catch(() => {
      // optional error handling
    });
  }, [groupId, personId, part, onSelectedChange]);

  if (status !== 'done' || pieces.length === 0) return null;

  return (
    <div className="ml-2 flex flex-wrap gap-3">
      {pieces.map((piece: any, idx: number) => {
        const imgSrc = Array.isArray(piece?.storeImages) && piece.storeImages.length > 0 ? piece.storeImages[0] : faviconUrl;
        const storeId = piece?.storePieceId || '-';
        const pieceName = piece?.name || '';
        const pid = normalizeId(piece) || String(idx);
        const isSelected = selectedPieceId === pid;
        return (
          <div key={pid} className="w-24 text-left">
            <button
              type="button"
              onClick={() => handlePieceClick(String(pid))}
              className="w-24 cursor-pointer focus:outline-none"
              title={pieceName}
            >
              <div className={`aspect-square w-24 h-24 overflow-hidden rounded border bg-white transition-colors duration-150 ${isSelected ? 'border-black' : 'border-gray-300 hover:border-gray-500'} hover:shadow-sm`}>
                <img src={imgSrc} alt={pieceName || String(part)} className="w-full h-full object-contain"/>
              </div>
            </button>
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
