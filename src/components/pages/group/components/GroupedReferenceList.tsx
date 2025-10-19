import React from 'react';
import {Button} from '@/components/ui';
import {Pencil, Trash2} from 'lucide-react';
import {InlineMemberEditor} from './InlineMemberEditor';
import {InlineTwoMembersEditor} from './InlineTwoMembersEditor';
import {StickyOverlay} from './StickyOverlay';
import {PersonRow as ImportedPersonRow} from './PersonRow';
import type {UpdateUserRequest} from '@/lib/types';

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
                                     }: GroupedReferenceListProps) {

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
                                    {(typeof onEditGroup === 'function' && entry?.status === 'pending') && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleEditGroupClick(entry)}
                                        >
                                            <Pencil className="h-4 w-4"/>
                                            <span className="sr-only">Editar grupo</span>
                                        </Button>
                                    )}
                                    {(typeof onDeleteGroup === 'function' && entry?.status === 'pending') && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDeleteGroupClick(entry)}
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
                                          groupId={groupId}/>;
            })}
        </div>
    );
}
