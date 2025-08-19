import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button, Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui";
import {
    addUserToGroup,
    createReferencePersonGroup,
    deleteReferencePersonGroup,
    deleteUserFromGroup,
    getGroupById,
    updateReferencePersonGroup,
    updateUserInGroup
} from '@/lib/services/groups';
import {toast} from 'sonner';
import {APP_ROUTES} from '@/constants/routes';
import {cn, navigate} from '@/lib/utils';
import {type AddUserRequest, type Group, type UpdateUserRequest} from '@/lib/types';
import {GROUP_STATUS} from '@/constants/uiConfig';
import {ConfirmDeleteDialog, GroupedReferenceList, InlineMemberEditor, InlineTwoMembersEditor} from './components';

export function GroupPage() {
    const {t} = useTranslation();
    const [group, setGroup] = useState<Group | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [groupId, setGroupId] = useState<string>('');

    // Inline add/edit state
    const [addingMode, setAddingMode] = useState<'none' | 'single' | 'pair'>('none');
    const [memberToEdit, setMemberToEdit] = useState<{
        id: string;
        name: string;
        email?: string;
        description?: string;
        avatar?: string;
        imageSignedUrl?: string;
        imagePath?: string;
        hasImage?: boolean;
        hairDescription?: string;
        faceDescription?: string;
    } | null>(null);
    const [editingGroup, setEditingGroup] = useState<{ entryId: string; name: string; people: any[] } | null>(null);

    // Delete confirmation dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<null | {
        id: string;
        name?: string;
        type: 'person' | 'group'
    }>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                // Get group ID from URL
                const urlParts = window.location.pathname.split('/');
                const id = urlParts[urlParts.length - 1];

                if (!id) {
                    toast.error(t('group.errorFetchingGroup'));
                    navigate(APP_ROUTES.DASHBOARD);
                    return;
                }

                // Set group ID
                setGroupId(id);

                // Fetch group details
                const fetchedGroup = await getGroupById(id);
                setGroup(fetchedGroup);
            } catch (error) {
                console.error('Error fetching group:', error);
                toast.error(t('group.errorFetchingGroup'));
                // Redirect to dashboard on error
                navigate(APP_ROUTES.DASHBOARD);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGroup();
    }, [t]);

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 py-6">
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    }

    if (!group) {
        return null;
    }

    // Handler for adding a member
    const handleAddMember = async (userData: AddUserRequest) => {
        try {
            const newUser = await addUserToGroup(groupId, userData);

            // Update the group with the new member
            if (group) {
                setGroup({
                    ...group,
                    referencePeople: [...group.referencePeople, newUser],
                    totalUsers: group.totalUsers + 1
                });
            }

            toast.success(t('group.memberAdded'));
        } catch (error) {
            console.error('Error adding member:', error);
            const msg = (error as any)?.message || '';
            if (typeof msg === 'string' && msg.includes('IMAGE_TOO_LARGE')) {
                toast.error(t('group.imageTooLarge', 'The selected image is too large. Maximum allowed is 2MB.'));
            } else {
                toast.error(t('group.errorAddingMember'));
            }
            throw error;
        }
    };

    // Handler for editing a member
    const handleEditMember = async (userData: UpdateUserRequest) => {
        try {
            await updateUserInGroup(groupId, userData);
            // Refresh group to reflect nested edits
            const fresh = await getGroupById(groupId);
            setGroup(fresh);
            toast.success(t('group.memberUpdated'));
        } catch (error) {
            console.error('Error updating member:', error);
            toast.error(t('group.errorUpdatingMember'));
            throw error;
        }
    };

    // Handler for deleting a member
    const handleDeleteMember = async (id: string) => {
        try {
            await deleteUserFromGroup(groupId, id);
            // Refresh group to reflect nested delete and counters
            const fresh = await getGroupById(groupId);
            setGroup(fresh);
            toast.success(t('group.memberDeleted'));
        } catch (error) {
            console.error('Error deleting member:', error);
            toast.error(t('group.errorDeletingMember'));
            throw error;
        }
    };

    // Get status configuration
    const statusConf = GROUP_STATUS[group.status];


    return (
        <div className={cn('container mx-auto p-4', (addingMode === 'none' && !memberToEdit) ? 'py-6' : 'pt-6 pb-2')}>
            <div className="mb-6">
                <Button
                    variant="outline"
                    onClick={() => navigate(APP_ROUTES.DASHBOARD)}
                    className="mb-4"
                >
                    ← {t('group.backToDashboard')}
                </Button>
                <h1 className="text-2xl font-bold">{t('group.title')}</h1>
            </div>

            <div className="flex flex-col gap-6">
                {/* Top Section: Group Details */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            {/* Group name and description */}
                            <div className="flex-1">
                                <h2 className="text-xl font-bold mb-2">{group.name}</h2>
                                <p className="text-gray-600 mb-4">{group.description}</p>
                            </div>

                            {/* Status and progress */}
                            <div className="flex-1 w-full">
                                {/* Group status */}
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-medium">{t('group.status')}</span>
                                    <div className={cn("px-3 py-1 rounded-full text-sm font-medium", statusConf.color)}>
                                        {t(statusConf.message)}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Middle Section: Group Members */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t('group.members')} ({group.totalUsers})</CardTitle>
                            <CardDescription>
                                {group.totalUsers > 0
                                    ? t('dashboard.groupMembers')
                                    : t('group.noMembers')}
                            </CardDescription>
                        </div>
                        {addingMode === 'none' && !editingGroup && !memberToEdit && (
                            <div className="flex items-center gap-2">
                                <Button variant="outline"
                                        onClick={() => setAddingMode('pair')}>{t('group.addTwoMembers')}</Button>
                                <Button onClick={() => setAddingMode('single')}>{t('group.addMember')}</Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {/* Inline editors for add modes */}
                        {addingMode === 'single' && !editingGroup && (
                            <div className="mb-2">
                                <InlineMemberEditor
                                    mode="add"
                                    onCancel={() => setAddingMode('none')}
                                    onSaveAdd={async (data) => {
                                        await handleAddMember(data);
                                        setAddingMode('none');
                                    }}
                                />
                            </div>
                        )}
                        {addingMode === 'pair' && !editingGroup && (
                            <div className="mb-2">
                                <InlineTwoMembersEditor
                                    onCancel={() => setAddingMode('none')}
                                    onAddGroup={async ({subgroupName, people}) => {
                                        try {
                                            await createReferencePersonGroup(groupId, subgroupName, people);
                                            const fresh = await getGroupById(groupId);
                                            setGroup(fresh);
                                            toast.success(t('group.memberAdded'));
                                            setAddingMode('none');
                                        } catch (error) {
                                            console.error('Error adding members group:', error);
                                            const msg = (error as any)?.message || '';
                                            if (typeof msg === 'string' && msg.includes('IMAGE_TOO_LARGE')) {
                                                toast.error(t('group.imageTooLarge', 'The selected image is too large. Maximum allowed is 2MB.'));
                                            } else {
                                                toast.error(t('group.errorAddingMember'));
                                            }
                                            throw error;
                                        }
                                    }}
                                />
                            </div>
                        )}


                        {group.referencePeople.length > 0 ? (
                            <div className="space-y-4">
                                <GroupedReferenceList
                                    entries={group.referencePeople as any}
                                    onEdit={(member) => {
                                        setMemberToEdit(member);
                                    }}
                                    onDelete={async (member) => {
                                        setDeleteTarget({id: member.id, name: member.name, type: 'person'});
                                        setConfirmOpen(true);
                                    }}
                                    onEditGroup={(grp) => {
                                        const entry = (group.referencePeople as any[]).find((e: any) => e.id === grp.id && e.type === 'group');
                                        if (entry && Array.isArray(entry.people) && entry.people.length > 0) {
                                            setEditingGroup({
                                                entryId: entry.id,
                                                name: entry.name,
                                                people: entry.people
                                            });
                                            setAddingMode('none');
                                        }
                                    }}
                                    onDeleteGroup={async (grp) => {
                                        setDeleteTarget({id: grp.id, name: grp.name, type: 'group'});
                                        setConfirmOpen(true);
                                    }}
                                    editingMemberId={memberToEdit?.id}
                                    editingMemberInitial={memberToEdit}
                                    onCancelEdit={() => setMemberToEdit(null)}
                                    onSaveEdit={async (data) => {
                                        await handleEditMember(data);
                                        setMemberToEdit(null);
                                    }}
                                    editingGroupId={editingGroup?.entryId}
                                    editingGroupInitial={editingGroup}
                                    onCancelEditGroup={() => setEditingGroup(null)}
                                    onSaveEditGroup={async ({entryId, subgroupName, people}) => {
                                        try {
                                            await updateReferencePersonGroup(groupId, entryId, {
                                                name: subgroupName,
                                                people
                                            });
                                            const fresh = await getGroupById(groupId);
                                            setGroup(fresh);
                                            toast.success(t('group.memberUpdated'));
                                            setEditingGroup(null);
                                        } catch (error) {
                                            console.error('Error updating members group:', error);
                                            toast.error(t('group.errorUpdatingMember'));
                                            throw error;
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <>
                                {addingMode === 'none' && !editingGroup && !memberToEdit && (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 mb-4">{t('group.addFirstMember')}</p>
                                        <div className="flex justify-center gap-2">
                                            <Button variant="outline"
                                                    onClick={() => setAddingMode('pair')}>{t('group.addTwoMembers')}</Button>
                                            <Button
                                                onClick={() => setAddingMode('single')}>{t('group.addMember')}</Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Bottom Section: Total Cost */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('group.totalCost')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-lg font-medium">{t('group.orderTotal')}</span>
                            <span className="text-xl font-bold">
                                {group.price ? `${group.price.toFixed(2)} €` : t('group.priceNotAvailable')}
                            </span>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Confirm deletion modal for member or subgroup */}
            <ConfirmDeleteDialog
                open={confirmOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setConfirmOpen(false);
                        setDeleteTarget(null);
                    } else {
                        setConfirmOpen(true);
                    }
                }}
                title={deleteTarget?.type === 'group' ? t('dashboard.deleteConfirmation.title') : t('group.deleteConfirmation.title')}
                description={deleteTarget?.type === 'group' ? t('dashboard.deleteConfirmation.description') : t('group.deleteConfirmation.description')}
                confirmLabel={deleteTarget?.type === 'group' ? t('dashboard.deleteConfirmation.confirm') : t('group.deleteConfirmation.confirm')}
                cancelLabel={deleteTarget?.type === 'group' ? t('dashboard.deleteConfirmation.cancel') : t('group.deleteConfirmation.cancel')}
                isDeleting={isDeleting}
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    setIsDeleting(true);
                    try {
                        if (deleteTarget.type === 'group') {
                            await deleteReferencePersonGroup(groupId, deleteTarget.id);
                            const fresh = await getGroupById(groupId);
                            setGroup(fresh);
                            toast.success(t('group.memberDeleted'));
                        } else {
                            await handleDeleteMember(deleteTarget.id);
                        }
                        setConfirmOpen(false);
                        setDeleteTarget(null);
                    } finally {
                        setIsDeleting(false);
                    }
                }}
            />
        </div>
    );
}
