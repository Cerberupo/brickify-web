import React from 'react';
import {useTranslation} from 'react-i18next';
import {Avatar, AvatarImage, Button} from '@/components/ui';
import {Pencil, Trash2} from 'lucide-react';
import {InlineMemberEditor} from './InlineMemberEditor';
import {InlineTwoMembersEditor} from './InlineTwoMembersEditor';
import type {UpdateUserRequest} from '@/lib/types';
import favicon from '@/images/favicon.png';

const faviconUrl: string = typeof favicon === 'string' ? favicon : (favicon as any).src;

interface GroupedReferenceListProps {
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
}

function PersonRow({person, onEdit, onDelete, showActions = true}: {
    person: any;
    onEdit: GroupedReferenceListProps['onEdit'];
    onDelete: GroupedReferenceListProps['onDelete'];
    showActions?: boolean
}) {
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

    // Truncate helper: clamp text to 220 chars and add ellipsis
    const truncate = (s: string, n = 220) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s);

    const noImageMarked = person?.hasImage === false || person?.noImage === true || !src;
    const hairPreview = firstParagraph(person?.hairDescription);
    const facePreview = firstParagraph(person?.faceDescription);
    // Limit to first two paragraphs and also cap each to ~220 chars
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

    return (
        <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 ring-1 ring-gray-200">
                    <AvatarImage className="object-cover" src={src || faviconUrl} alt={person?.name || ''}/>
                </Avatar>
                <div className="min-w-0">
                    <div className="font-medium leading-tight">{person?.name}</div>
                    {/* Main description (general notes) limited to 2 paragraphs */}
                    <div className="text-sm text-gray-600 max-w-prose whitespace-pre-wrap break-words">
                        {mainDescription ? (
                            mainDescription
                        ) : (
                            <span
                                className="text-gray-400 italic">{t('group.noDescription', 'No description provided')}</span>
                        )}
                    </div>
                </div>
                {/* Hair/Face previews shown to the right of name/description */}
                {noImageMarked && (hairPreview || facePreview) && (
                    <div className="ml-4 pl-4 border-l space-y-0.5 text-xs text-gray-600">
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
            </div>
            {showActions && (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit({
                            id: person.id,
                            name: person.name,
                            description: person.description,
                            avatar: person.avatar,
                            imageSignedUrl: person.imageSignedUrl,
                            imagePath: person.imagePath,
                            hasImage: person.hasImage,
                            hairDescription: person.hairDescription,
                            faceDescription: person.faceDescription,
                        })}
                    >
                        <Pencil className="h-4 w-4"/>
                        <span className="sr-only">{t('group.editMember')}</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDelete({id: person.id, name: person.name})}
                    >
                        <Trash2 className="h-4 w-4"/>
                        <span className="sr-only">{t('group.deleteMember')}</span>
                    </Button>
                </div>
            )}
        </div>
    );
}

export function GroupedReferenceList({
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
                                     }: GroupedReferenceListProps) {
    return (
        <div className="flex flex-col gap-3">
            {entries.map((entry: any) => {
                if (entry?.type === 'group' && Array.isArray(entry?.people)) {
                    // If this group is currently being edited, render the two-members inline editor in place
                    if (editingGroupId && entry.id === editingGroupId && onSaveEditGroup && onCancelEditGroup) {
                        return (
                            <div key={entry.id} className="rounded-md border-l-4 border-primary/20 p-2">
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
                            </div>
                        );
                    }
                    return (
                        <div key={entry.id} className="rounded-md border p-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold">{entry.name}</div>
                                <div className="flex items-center gap-2">
                                    {typeof onEditGroup === 'function' && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => onEditGroup({id: entry.id, name: entry.name})}
                                        >
                                            <Pencil className="h-4 w-4"/>
                                            <span className="sr-only">Editar grupo</span>
                                        </Button>
                                    )}
                                    {typeof onDeleteGroup === 'function' && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => onDeleteGroup({id: entry.id, name: entry.name})}
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                            <span className="sr-only">Eliminar grupo</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                {entry.people.map((p: any) => (
                                    (editingMemberId && p.id === editingMemberId && onSaveEdit && onCancelEdit) ? (
                                        <div key={p.id} className="rounded-md border-l-4 border-primary/20 p-2">
                                            <InlineMemberEditor
                                                mode="edit"
                                                initial={editingMemberInitial || p}
                                                onCancel={onCancelEdit}
                                                onSaveEdit={onSaveEdit}
                                            />
                                        </div>
                                    ) : (
                                        <PersonRow key={p.id} person={p} onEdit={onEdit} onDelete={onDelete}
                                                   showActions={false}/>
                                    )
                                ))}
                            </div>
                        </div>
                    );
                }
                // Treat everything else as a single person entry
                if (editingMemberId && entry?.id === editingMemberId && onSaveEdit && onCancelEdit) {
                    return (
                        <div key={entry.id} className="rounded-md border-l-4 border-primary/20 p-2">
                            <InlineMemberEditor
                                mode="edit"
                                initial={editingMemberInitial || entry}
                                onCancel={onCancelEdit}
                                onSaveEdit={onSaveEdit}
                            />
                        </div>
                    );
                }
                return <PersonRow key={entry.id} person={entry} onEdit={onEdit} onDelete={onDelete}/>;
            })}
        </div>
    );
}
