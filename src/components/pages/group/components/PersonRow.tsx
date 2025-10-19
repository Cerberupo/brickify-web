import React, {useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {Button} from '@/components/ui';
import {Download, Pencil, Trash2} from 'lucide-react';
import favicon from '@/images/favicon.png';
import {PartPieces} from './PartPieces';
import type {MatchPart} from '@/lib/services/groups';

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
}

export function PersonRow({person, onEdit, onDelete, showActions = true, groupId}: PersonRowProps) {
    const {t} = useTranslation();
    const src = person?.imageSignedUrl || person?.imagePath || person?.avatar;

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
    console.log('__parts', __parts);
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
                const sel = m?.selectedPiece;
                const selId = normalizeId(sel);
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
        const safeName = (person?.name || 'piezas').toString().trim().replace(/\s+/g, '-');
        a.href = url;
        a.download = `${safeName}-piezas.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }, [person]);

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

    return (
        <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div className="flex items-center gap-3">
                <div className={`flex ${person.status === 'processed' ? 'flex-col' : 'flex-row'} items-center gap-3`}>
                    <img className={`${person.status === 'processed' ? 'w-40' : 'w-8'} border rounded`}
                         src={src || faviconUrl}
                         alt={person?.name || ''}/>
                    <div className="min-w-0">
                        <div className="font-medium leading-tight">{person?.name}</div>
                        <div className="text-sm text-gray-600 max-w-prose whitespace-pre-wrap break-words">
                            {mainDescription ? (
                                mainDescription
                            ) : (
                                <span
                                    className="text-gray-400 italic">{t('group.noDescription', 'No description provided')}</span>
                            )}
                        </div>
                    </div>
                </div>
                {noImageMarked && (hairPreview || facePreview) && (
                    <div className="pl-4 border-l space-y-0.5 text-xs text-gray-600">
                        {hairPreview && (
                            <div>
                                <span className="font-medium text-gray-700">{t('group.hairDescription')}:</span>{' '}
                                <span>{hairPreview}</span>
                            </div>
                        )}
                        {facePreview && (
                            <div>
                                <span className="font-medium text-gray-700">{t('group.faceDescription')}:</span>{' '}
                                <span>{facePreview}</span>
                            </div>
                        )}
                    </div>
                )}
                {person?.status && person.status !== 'pending' && person?.matches && (
                    <div className="pl-4 border-l space-y-1 text-xs text-gray-600">
                        {Object.entries(person.matches).map(([part, data]: any) => {
                            const status = (data as any)?.status;
                            return (
                                <div key={String(part)} className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
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
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="flex gap-2 items-center">
                {person?.status === 'processed' && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadClick}
                    >
                        <Download className="h-4 w-4 mr-1"/> {t('group.downloadPieces', 'Descargar piezas')}
                    </Button>
                )}
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
