import React, {useCallback, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button, Toaster} from '@/components/ui';
import {Camera, Download, Pencil, Trash2} from 'lucide-react';
import favicon from '@/images/favicon.png';
import {PartPieces} from './PartPieces';
import type {MatchPart} from '@/lib/services/groups';
import ShareActions from '@/components/common/ShareActions';
import {LegoComposite} from '@/components';
import {toSideWithFallback} from '@/lib/lego/parts';
import {DevPreviewModal} from './DevPreviewModal';

const faviconUrl: string = typeof favicon === 'string' ? favicon : (favicon as any).src;

export interface PersonRowProps {
    person: any;
    groupId: string;
    onEdit: (member: {
        id: string;
        name: string;
        description?: string;
        avatar?: string;
        imageSignedUrl?: string;
        imagePath?: string;
        hasImage?: boolean;
        hairDescription?: string;
        faceDescription?: string;
    }) => void;
    onDelete: (member: { id: string; name: string }) => void;
    showActions?: boolean;
    onPartSelectedChange?: (personId: string, part: MatchPart, pieceId: string | null) => void;
    // Group state (lifted) to allow in-place updates when sharing is enabled/disabled
    group?: any;
    setGroup?: (g: any) => void;
}

export function PersonRow({
                              person,
                              onEdit,
                              onDelete,
                              showActions = true,
                              groupId,
                              onPartSelectedChange,
                              group,
                              setGroup
                          }: PersonRowProps) {
    const {t} = useTranslation();
    const src = person?.imageSignedUrl || person?.imagePath || person?.avatar;

    // Share mode state (derived from person if available, otherwise false)
    const initialShareEnabled = useMemo(() => {
        return Boolean((person as any)?.shareEnabled || (person as any)?.sharingEnabled || (person as any)?.share?.enabled);
    }, [person]);

    const [selectedByPart, setSelectedByPart] = useState<Record<string, string | null>>({});
    const handlePartSelectedChange = useCallback((part: MatchPart, pieceId: string | null) => {
        setSelectedByPart(prev => ({...prev, [part]: pieceId}));
        if (onPartSelectedChange) onPartSelectedChange(person.id, part, pieceId);
    }, [onPartSelectedChange, person.id]);

    const splitParagraphs = (txt?: string) => {
        if (!txt) return [] as string[];
        return txt
            .split(/\r?\n\r?\n|\n|\r/)
            .map((p) => p.trim())
            .filter(Boolean);
    };

    const firstParagraph = (txt?: string) => {
        const parts = splitParagraphs(txt);
        const first = parts[0] || '';
        return first.length > 220 ? first.slice(0, 220).trimEnd() + '…' : first;
    };

    const truncate = (s: string, n = 220) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s);

    const noImageMarked = person?.hasImage === false || person?.noImage === true || !src;
    const hairPreview = firstParagraph(person?.hairDescription);
    const facePreview = firstParagraph(person?.faceDescription);

    const __parts = splitParagraphs(person?.description);
    const __limited = __parts.slice(0, 2).map(p => truncate(p));
    if (__parts.length > 2 && __limited.length > 0) {
        const lastIdx = __limited.length - 1;
        if (!__limited[lastIdx].endsWith('…')) {
            __limited[lastIdx] = __limited[lastIdx] + '…';
        }
    }
    const mainDescription = __limited.join('\n\n');

    const getStatusPillClasses = (s?: string) => {
        const norm = String(s || '').toLowerCase();
        const base = 'px-2 py-0.5 rounded-full ';
        if (norm === 'in-process') return base + 'bg-yellow-100 text-yellow-800';
        if (norm === 'error') return base + 'bg-red-100 text-red-700';
        if (norm === 'done') return base + 'bg-green-100 text-green-700';
        return base + 'bg-gray-100 text-gray-700';
    };

    const normalizeId = (p: any): string | null => {
        if (!p) return null;
        if (typeof p === 'string') return p;
        const id = p.id || p._id || p.pieceId;
        return id ? String(id) : null;
    };

    const handleDownloadClick = useCallback(() => {
        const elementIds: string[] = [];
        if (person?.matches && typeof person.matches === 'object') {
            for (const key of Object.keys(person.matches)) {
                const m = (person.matches as any)[key];
                // Prefer the locally selected id captured from PartPieces
                const localSelId = selectedByPart[key] || null;
                const serverSel = m?.selectedPiece;
                const serverSelId = normalizeId(serverSel);
                const selId = localSelId || serverSelId;
                const arr = Array.isArray(m?.matchedPieceIds) ? m.matchedPieceIds : [];
                if (selId) {
                    const found = arr.find((p: any) => normalizeId(p) === selId);
                    const elementId = found?.storePieceId || found?.elementId || selId;
                    if (elementId) elementIds.push(String(elementId));
                }
            }
        }
        const payload = elementIds.map(eid => ({elementId: eid, quantity: 1}));
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = (person?.name || 'pieces').toString().trim().replace(/\s+/g, '-');
        a.href = url;
        a.download = `${safeName}-pieces.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }, [person, selectedByPart]);

    const handleEditClick = useCallback(() => {
        onEdit({
            id: person.id,
            name: person.name,
            description: person.description,
            avatar: person.avatar,
            imageSignedUrl: person.imageSignedUrl,
            imagePath: person.imagePath,
            hasImage: person.hasImage,
            hairDescription: person.hairDescription,
            faceDescription: person.faceDescription,
        });
    }, [onEdit, person]);

    const handleDeleteClick = useCallback(() => {
        onDelete({id: person.id, name: person.name});
    }, [onDelete, person]);

    // guest_key (si existe) para mantener compatibilidad con el flujo guest
    const guestKey: string | null = useMemo(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            return params.get('guest_key');
        } catch {
            return null;
        }
    }, []);

    // Construir selección actual por parte y mapping a imágenes front/back
    const selectedPieceByPart: Partial<Record<MatchPart, any>> = useMemo(() => {
        const out: Partial<Record<MatchPart, any>> = {};
        const matches = (person as any)?.matches || {};
        (['wig', 'head', 'upperPart', 'lowerPart'] as MatchPart[]).forEach((part) => {
            const data = matches?.[part];
            if (!data) return;
            const arr: any[] = Array.isArray(data?.matchedPieceIds) ? data.matchedPieceIds : [];
            if (arr.length === 0) return;
            const localSelId = selectedByPart[part] || null;
            const serverSel = data?.selectedPiece;
            const serverSelId = typeof serverSel === 'string' ? serverSel : normalizeId(serverSel);
            const selId = localSelId || serverSelId || normalizeId(arr[0]);
            const found = arr.find((p: any) => normalizeId(p) === selId) || arr[0];
            if (found) out[part] = found;
        });
        return out;
    }, [person, selectedByPart]);

    // Mapear MatchPart a categoría UI para aplicar fallbacks reutilizables
    const partToCategory = (part: MatchPart): 'hair' | 'head' | 'body' | 'pants' => {
        switch (part) {
            case 'wig':
                return 'hair';
            case 'head':
                return 'head';
            case 'upperPart':
                return 'body';
            case 'lowerPart':
                return 'pants';
            default:
                return 'head';
        }
    };

    const compositeProps = useMemo(() => {
        const wig = toSideWithFallback(partToCategory('wig'), selectedPieceByPart.wig);
        const head = toSideWithFallback(partToCategory('head'), selectedPieceByPart.head);
        const upperPart = toSideWithFallback(partToCategory('upperPart'), selectedPieceByPart.upperPart);
        const lowerPart = toSideWithFallback(partToCategory('lowerPart'), selectedPieceByPart.lowerPart);
        const hasAny = Boolean(
            selectedPieceByPart.wig ||
            selectedPieceByPart.head ||
            selectedPieceByPart.upperPart ||
            selectedPieceByPart.lowerPart
        );
        return {wig, head, upperPart, lowerPart, hasAny};
    }, [selectedPieceByPart]);

    // Control del lado (front/back) sincronizado entre composite y miniaturas
    const [side, setSide] = useState<'front' | 'back'>('front');

    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const appEnv = (import.meta.env.PUBLIC_APP_ENV as string | undefined) || (import.meta.env.PROD ? 'prod' : 'dev');
    const isDev = appEnv === 'dev';

    const showSocialPreviewLabel = t('common.actions') + ' (DEV)';

    const showSocialPreview = useMemo(() => {
        if (!isDev) return false;
        try {
            const params = new URLSearchParams(window.location.search);
            return params.has('photo');
        } catch {
            return false;
        }
    }, [isDev]);

    return (
        <div className="flex flex-col sm:flex-row gap-3 rounded-md border p-3">
            <DevPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                originalImage={src || faviconUrl}
                personName={person?.name || ''}
                person={person}
                legoProps={{...compositeProps, side, onSideChange: (s) => setSide(s)}}
                selectedPieceByPart={selectedPieceByPart}
            />
            <Toaster position="top-right"/>
            <div className="flex flex-col gap-3 flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-start gap-3">
                    <div
                        className="flex flex-col items-center text-center gap-3 w-40 shrink-0">
                        <img
                            className={`${person.status === 'processed' ? 'w-40' : 'w-12 sm:w-20 md:w-24 lg:w-28'} border rounded shrink-0`}
                            src={src || faviconUrl}
                            alt={person?.name || ''}
                            onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                if (target.getAttribute('crossorigin') === 'anonymous') {
                                    target.removeAttribute('crossorigin');
                                    target.src = src || faviconUrl;
                                }
                            }}
                        />
                        <div className="w-full">
                            <div className="font-medium leading-tight truncate px-1"
                                 title={person?.name}>{person?.name}</div>
                            {/*
                            <div className="text-sm text-gray-600 max-w-prose whitespace-pre-wrap break-words">
                                {mainDescription ? (
                                    mainDescription
                                ) : (
                                    <span
                                        className="text-gray-400 italic">{t('group.noDescription', 'No description provided')}</span>
                                )}
                            </div>
                            */}
                        </div>
                    </div>
                    {noImageMarked && (hairPreview || facePreview) && (
                        <div className="pl-4 border-l space-y-0.5 text-xs text-gray-600">
                            {hairPreview && (
                                <div>
                                    <span
                                        className="font-medium text-gray-700">{t('group.hairDescription')}:</span>{' '}
                                    <span>{hairPreview}</span>
                                </div>
                            )}
                            {facePreview && (
                                <div>
                                    <span
                                        className="font-medium text-gray-700">{t('group.faceDescription')}:</span>{' '}
                                    <span>{facePreview}</span>
                                </div>
                            )}
                        </div>
                    )}
                    {person?.status && person.status !== 'pending' && person?.matches && (
                        <div className="pl-0 sm:pl-4 sm:border-l space-y-1 text-xs text-gray-600 flex-1 min-w-0">
                            {Object.entries(person.matches).map(([part, data]: any) => {
                                const status = (data as any)?.status;
                                return (
                                    <div key={String(part)} className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="font-medium text-gray-700">{t(`group.parts.${String(part)}`, String(part))}</span>
                                            <span className={getStatusPillClasses(status)}>
                          {t(`dashboard.groupStatus.${String(status)}`)}
                        </span>
                                        </div>
                                        <PartPieces
                                            groupId={groupId}
                                            personId={person.id}
                                            part={part as MatchPart}
                                            data={data}
                                            onSelectedChange={handlePartSelectedChange}
                                            side={side}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {/* Preview en móviles (debajo, ancho completo y centrado) */}
                    {compositeProps.hasAny && (
                        <div className="sm:hidden w-full max-w-xs mx-auto">
                            <LegoComposite
                                wig={compositeProps.wig}
                                head={compositeProps.head}
                                upperPart={compositeProps.upperPart}
                                lowerPart={compositeProps.lowerPart}
                                className="w-full"
                                locale={window?.location?.pathname?.startsWith('/es') ? 'es' : 'en'}
                                side={side}
                                onSideChange={(next) => setSide(next)}
                            />
                        </div>
                    )}
                    {compositeProps.hasAny && (
                        <div className="hidden sm:block w-48 md:w-56 lg:w-64 shrink-0 ml-auto">
                            <LegoComposite
                                wig={compositeProps.wig}
                                head={compositeProps.head}
                                upperPart={compositeProps.upperPart}
                                lowerPart={compositeProps.lowerPart}
                                className="w-full"
                                locale={window?.location?.pathname?.startsWith('/es') ? 'es' : 'en'}
                                side={side}
                                onSideChange={(next) => setSide(next)}
                            />
                        </div>
                    )}
                </div>
                {person?.status === 'processed' && (
                    <div
                        className="mt-auto pt-2 border-t flex flex-wrap items-center gap-3 justify-end sm:justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadClick}
                        >
                            <Download className="h-4 w-4 mr-1"/> {t('group.downloadPieces', 'Descargar piezas')}
                        </Button>
                        {showSocialPreview && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsPreviewModalOpen(true)}
                                className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                            >
                                <Camera className="h-4 w-4 mr-1"/> {showSocialPreviewLabel}
                            </Button>
                        )}
                        {/* En responsive, forzar que el bloque de compartir salte a la siguiente línea */}
                        <div className="basis-full sm:basis-auto w-full sm:w-auto flex justify-end">
                            <div className="flex gap-3 items-center">
                                <ShareActions
                                    groupId={groupId}
                                    personId={person.id}
                                    groupShareId={group?.share?.id}
                                    personShareId={person?.share?.id}
                                    initialEnabled={initialShareEnabled}
                                    locale={typeof window !== 'undefined' && window.location.pathname.startsWith('/es') ? 'es' : 'en'}
                                    guestKey={guestKey}
                                    onEnabledChange={(enabled, ids) => {
                                        // Mantener sincronizado el estado del grupo local
                                        if (!setGroup || !group) return;
                                        setGroup((prev: any) => {
                                            const base = prev || group;
                                            const applyToPerson = (p: any) => {
                                                if (String(p.id) !== String(person.id)) return p;
                                                const newShare = {
                                                    ...(p.share || {}),
                                                    enabled,
                                                    ...(ids?.personShareId ? {id: ids.personShareId} : {})
                                                };
                                                return {...p, share: newShare};
                                            };
                                            const updatedReferencePeople = Array.isArray(base?.referencePeople)
                                                ? base.referencePeople.map((entry: any) => {
                                                    if (entry?.type === 'group' && Array.isArray(entry.people)) {
                                                        return {...entry, people: entry.people.map(applyToPerson)};
                                                    }
                                                    return String(entry?.id) === String(person.id) ? applyToPerson(entry) : entry;
                                                })
                                                : base?.referencePeople;
                                            const updatedShare = {
                                                ...(base?.share || {}),
                                                ...(ids?.groupShareId ? {id: ids.groupShareId} : {})
                                            };
                                            return {
                                                ...base,
                                                referencePeople: updatedReferencePeople,
                                                share: updatedShare
                                            };
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex gap-2 items-center">
                {(showActions && person?.status === 'pending') && (
                    <>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleEditClick}
                        >
                            <Pencil className="h-4 w-4"/>
                            <span className="sr-only">{t('group.editMember')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={handleDeleteClick}
                        >
                            <Trash2 className="h-4 w-4"/>
                            <span className="sr-only">{t('group.deleteMember')}</span>
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
