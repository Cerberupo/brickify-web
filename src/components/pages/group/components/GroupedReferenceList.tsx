import React from 'react';
import {Button} from '@/components/ui';
import {Download, Pencil, Trash2} from 'lucide-react';
import {InlineMemberEditor} from './InlineMemberEditor';
import {InlineTwoMembersEditor} from './InlineTwoMembersEditor';
import {StickyOverlay} from './StickyOverlay';
import {PersonRow as ImportedPersonRow} from './PersonRow';
import type {UpdateUserRequest} from '@/lib/types';
import {useTranslation} from 'react-i18next';

interface GroupedReferenceListProps {
    groupId: string;
    entries: any[]; // top-level referencePeople array: person | group
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
    onEditGroup?: (group: { id: string; name: string }) => void;
    onDeleteGroup?: (group: { id: string; name: string }) => void;
    // In-place edit support (single member)
    editingMemberId?: string | null;
    editingMemberInitial?: {
        id?: string;
        name?: string;
        description?: string;
        imageSignedUrl?: string;
        imagePath?: string;
        avatar?: string;
        hasImage?: boolean;
        hairDescription?: string;
        faceDescription?: string;
    } | null;
    onCancelEdit?: () => void;
    onSaveEdit?: (data: UpdateUserRequest) => Promise<void>;
    // In-place edit support (group)
    editingGroupId?: string | null;
    editingGroupInitial?: { entryId: string; name: string; people: any[] } | null;
    onCancelEditGroup?: () => void;
    onSaveEditGroup?: (data: { entryId: string; subgroupName: string; people: any[] }) => Promise<void>;
    // Group state for share updates
    group: any;
    setGroup: (g: any) => void;
}

export function GroupedReferenceList({
                                         groupId,
                                         entries,
                                         onEdit,
                                         onDelete,
                                         onEditGroup,
                                         onDeleteGroup,
                                         editingMemberId,
                                         editingMemberInitial,
                                         onCancelEdit,
                                         onSaveEdit,
                                         editingGroupId,
                                         editingGroupInitial,
                                         onCancelEditGroup,
                                         onSaveEditGroup,
                                         group,
                                         setGroup,
                                     }: GroupedReferenceListProps) {

    const {t} = useTranslation();

    const [selectedByPerson, setSelectedByPerson] = React.useState<Record<string, Record<string, string | null>>>({});

    const handlePartSelectedChange = React.useCallback((personId: string, part: string, pieceId: string | null) => {
        setSelectedByPerson(prev => ({
            ...prev,
            [personId]: {
                ...(prev[personId] || {}),
                [part]: pieceId,
            },
        }));
    }, []);

    const normalizeId = (p: any): string | null => {
        if (!p) return null;
        if (typeof p === 'string') return p;
        const id = p.id || p._id || p.pieceId;
        return id ? String(id) : null;
    };

    const collectFromPerson = (person: any): string[] => {
        const out: string[] = [];
        const matches = person?.matches && typeof person.matches === 'object' ? person.matches : null;
        if (!matches) return out;
        for (const key of Object.keys(matches)) {
            const m = (matches as any)[key];
            const partStatus = String(m?.status || '').toLowerCase();
            const arr = Array.isArray(m?.matchedPieceIds) ? m.matchedPieceIds : [];
            if (partStatus !== 'done' || arr.length === 0) continue;
            const localSelId = (selectedByPerson[person.id] && selectedByPerson[person.id][key]) || null;
            const selId = localSelId || normalizeId(m?.selectedPiece) || normalizeId(arr[0]);
            if (!selId) continue;
            const found = arr.find((p: any) => normalizeId(p) === selId) || arr[0];
            const elementId = found?.storePieceId || found?.elementId || selId;
            if (elementId) out.push(String(elementId));
        }
        return out;
    };

    const flattenPeople = (all: any[]): any[] => {
        const people: any[] = [];
        for (const e of all) {
            if (e?.type === 'group' && Array.isArray(e?.people)) {
                people.push(...e.people);
            } else if (e) {
                people.push(e);
            }
        }
        return people;
    };

    const hasAnyGeneratedPieces = (() => {
        const people = flattenPeople(entries);
        for (const p of people) {
            if (String(p?.status || '').toLowerCase() !== 'processed') continue;
            const matches = p?.matches && typeof p.matches === 'object' ? p.matches : null;
            if (!matches) continue;
            for (const key of Object.keys(matches)) {
                const m = (matches as any)[key];
                const partStatus = String(m?.status || '').toLowerCase();
                const arr = Array.isArray(m?.matchedPieceIds) ? m.matchedPieceIds : [];
                if (partStatus === 'done' && arr.length > 0) return true;
            }
        }
        return false;
    })();

    const downloadJson = (data: any, filename: string) => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    };

    const handleDownloadAllClick = () => {
        const people = flattenPeople(entries).filter(p => String(p?.status || '').toLowerCase() === 'processed');
        const elementIds: string[] = [];
        for (const p of people) {
            elementIds.push(...collectFromPerson(p));
        }

        // Group elementIds by value and count quantities
        const quantities: { [key: string]: number } = {};
        elementIds.forEach(id => {
            quantities[id] = (quantities[id] || 0) + 1;
        });

        const payload = Object.entries(quantities).map(([elementId, quantity]) => ({
            elementId,
            quantity
        }));

        if (payload.length === 0) return;
        const chunkSize = 199;
        const totalChunks = Math.ceil(payload.length / chunkSize);
        for (let i = 0; i < totalChunks; i++) {
            const chunk = payload.slice(i * chunkSize, (i + 1) * chunkSize);
            const fname = totalChunks > 1 ? `pieces-${i + 1}.json` : 'pieces.json';
            downloadJson(chunk, fname);
        }
    };

    const handleEditGroupClick = (entry: any) => {
        if (typeof onEditGroup === 'function') {
            onEditGroup({id: entry.id, name: entry.name});
        }
    };

    const handleDeleteGroupClick = (entry: any) => {
        if (typeof onDeleteGroup === 'function') {
            onDeleteGroup({id: entry.id, name: entry.name});
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-end">
                {hasAnyGeneratedPieces && (
                    <Button variant="outline" size="sm" onClick={handleDownloadAllClick}>
                        <Download
                            className="h-4 w-4 mr-1"/> {t('group.downloadAllPieces', 'Descargar todas las piezas')}
                    </Button>
                )}
            </div>
            {entries.map((entry: any) => {
                if (entry?.type === 'group' && Array.isArray(entry?.people)) {
                    // If this group is currently being edited, render the two-members inline editor in place
                    if (editingGroupId && entry.id === editingGroupId && onSaveEditGroup && onCancelEditGroup) {
                        return (
                            <StickyOverlay>
                                <InlineTwoMembersEditor
                                    mode="edit"
                                    initialGroup={editingGroupInitial || {
                                        entryId: entry.id,
                                        name: entry.name,
                                        people: entry.people
                                    }}
                                    onCancel={onCancelEditGroup}
                                    onUpdateGroup={onSaveEditGroup}
                                />
                            </StickyOverlay>
                        );
                    }
                    return (
                        <div key={entry.id} className="rounded-md border p-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold">{entry.name}</div>
                                <div className="flex items-center gap-2">
                                    {(typeof onEditGroup === 'function' && (entry?.status === 'pending' || entry?.status === undefined)) && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleEditGroupClick(entry)}
                                        >
                                            <Pencil className="h-4 w-4"/>
                                            <span className="sr-only">{t('group.editGroup', 'Editar colección')}</span>
                                        </Button>
                                    )}
                                    {(typeof onDeleteGroup === 'function' && (entry?.status === 'pending' || entry?.status === undefined)) && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDeleteGroupClick(entry)}
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                            <span
                                                className="sr-only">{t('group.deleteGroup', 'Eliminar colección')}</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                {entry.people.map((p: any) => (
                                    (editingMemberId && p.id === editingMemberId && onSaveEdit && onCancelEdit) ? (
                                        <StickyOverlay>
                                            <InlineMemberEditor
                                                mode="edit"
                                                initial={editingMemberInitial || p}
                                                onCancel={onCancelEdit}
                                                onSaveEdit={onSaveEdit}
                                            />
                                        </StickyOverlay>
                                    ) : (
                                        <ImportedPersonRow key={p.id} person={p} onEdit={onEdit} onDelete={onDelete}
                                                           groupId={groupId}
                                                           showActions={false}
                                                           onPartSelectedChange={handlePartSelectedChange}
                                                           group={group}
                                                           setGroup={setGroup}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    );
                }
                // Treat everything else as a single person entry
                if (editingMemberId && entry?.id === editingMemberId && onSaveEdit && onCancelEdit) {
                    return (
                        <StickyOverlay>
                            <InlineMemberEditor
                                mode="edit"
                                initial={editingMemberInitial || entry}
                                onCancel={onCancelEdit}
                                onSaveEdit={onSaveEdit}
                            />
                        </StickyOverlay>
                    );
                }
                return <ImportedPersonRow key={entry.id} person={entry} onEdit={onEdit} onDelete={onDelete}
                                          groupId={groupId}
                                          onPartSelectedChange={handlePartSelectedChange}
                                          group={group}
                                          setGroup={setGroup}
                />;
            })}
        </div>
    );
}
