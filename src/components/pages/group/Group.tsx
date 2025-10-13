import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button, CardContent} from "@/components/ui";
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
import {
    ConfirmDeleteDialog,
    GroupedReferenceList,
    GroupHeader,
    GroupSummaryHeader,
    InlineMemberEditor,
    InlineTwoMembersEditor,
    OrderSummaryCard,
    StickyOverlay
} from './components';
import {getUnitPrices} from '@/lib/services/stripe';

export function GroupPage() {
    const {t} = useTranslation();
    const [group, setGroup] = useState<Group | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [groupId, setGroupId] = useState<string>('');
    const [unitPrices, setUnitPrices] = useState<{
        single: {
            id: string;
            name: string | null;
            unitAmount: number;
            currency: string;
            taxBehavior?: 'inclusive' | 'exclusive' | null
        } | null;
        group: {
            id: string;
            name: string | null;
            unitAmount: number;
            currency: string;
            taxBehavior?: 'inclusive' | 'exclusive' | null
        } | null
    }>({single: null, group: null});

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
                // Get group ID from query parameter ?id=...
                const params = new URLSearchParams(window.location.search);
                const id = params.get('id') || '';

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
        // Fetch unit prices for summary
        getUnitPrices().then(setUnitPrices).catch(() => {
        });
    }, [t]);

    // Poll group details every 15s while status is inProcess
    useEffect(() => {

        console.log('polling group details');
        if (!groupId) return;
        if (group?.status !== 'inAssembly') {
            return; // no polling unless inProcess
        }

        let intervalId: number | null = null;
        const isFetchingRef = {current: false} as { current: boolean };

        const tick = async () => {
            if (isFetchingRef.current) return;
            isFetchingRef.current = true;
            try {
                console.log('polling group fetch details');
                const fresh = await getGroupById(groupId);
                setGroup(fresh);
                // Stop polling automatically if status changed
                if (fresh?.status !== 'inAssembly' && intervalId != null) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            } catch (e) {
                // swallow errors; next tick will retry
            } finally {
                isFetchingRef.current = false;
            }
        };

        // initial wait until first tick; keep it simple and start after 15s
        intervalId = window.setInterval(tick, 15000);

        return () => {
            if (intervalId != null) {
                clearInterval(intervalId);
            }
        };
    }, [group?.status, groupId]);

    // Use backend-provided totalUsers for consistency with dashboard card and API
    const totalMembers = group?.totalUsers ?? 0;

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
                    totalUsers: group.totalUsers + 1,
                    status: 'readyForPayment'
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

    // Editable only when group is either needing more users or ready for payment
    const canEdit = group.status === 'needsMoreUsers' || group.status === 'readyForPayment';


    return (
        <div className={cn('container mx-auto p-4', (addingMode === 'none' && !memberToEdit) ? 'py-6' : 'pt-6 pb-2')}>
            {/* Sticky top bar with header and (conditionally) add buttons */}
            <div
                className="sticky top-0 z-30 -mx-4 px-4 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b pt-4 pb-3 mb-6">
                <GroupHeader
                    onBack={() => navigate(APP_ROUTES.DASHBOARD)}
                    backLabel={t('group.backToDashboard')}
                    title={t('group.title')}
                />

                {/* Sticky Group summary (name/status/avatars) */}
                <div className="py-2">
                    <GroupSummaryHeader
                        name={group.name}
                        description={group.description}
                        statusLabel={t(statusConf.message)}
                        statusClassName={statusConf.color}
                        groupMembersLabel={t('dashboard.groupMembers')}
                        totalMembers={totalMembers}
                        entries={group.referencePeople as any[]}
                        actions={canEdit && addingMode === 'none' && !editingGroup && !memberToEdit && group.referencePeople.length > 0 ? (
                            <>
                                {/**/}
                                <Button onClick={() => setAddingMode('single')}>{t('group.addMember')}</Button>
                            </>
                        ) : null}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Top Section: Group Details (moved to sticky bar) */}

                {/* Middle Section: Group Members */}
                <CardContent>
                    {/* Inline editors for add modes */}
                    {canEdit && addingMode === 'single' && !editingGroup && (
                        <StickyOverlay>
                            <InlineMemberEditor
                                mode="add"
                                onCancel={() => setAddingMode('none')}
                                onSaveAdd={async (data) => {
                                    await handleAddMember(data);
                                    setAddingMode('none');
                                }}
                            />
                        </StickyOverlay>
                    )}
                    {addingMode === 'pair' && !editingGroup && (
                        <StickyOverlay>
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
                        </StickyOverlay>
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
                                        {/*<Button variant="outline"
                                                onClick={() => setAddingMode('pair')}>{t('group.addTwoMembers')}</Button>
                                        */}
                                        <Button
                                            onClick={() => setAddingMode('single')}>{t('group.addMember')}</Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>

                {/* Bottom Section: Order Summary */}
                {group.status === 'readyForPayment' && (<OrderSummaryCard
                    title={t('group.totalCost')}

                    unitPrices={unitPrices as any}
                    entries={(group.referencePeople as any[]) || []}
                    canEdit={canEdit}
                    onCheckout={() => navigate(`/checkout?groupId=${groupId}`)}
                    labels={{
                        item: t('checkout.item', 'Item'),
                        qty: t('checkout.qty', 'Qty'),
                        unit: t('checkout.unitPrice', 'Unit'),
                        subtotal: t('checkout.subtotal', 'Subtotal'),
                        shipping: t('checkout.shipping', 'Shipping'),
                        discount: t('checkout.discount', 'Discount'),
                        tax: t('checkout.tax', 'Tax'),
                        total: t('checkout.total', 'Total'),
                        subtotalExclVat: t('group.summary.subtotalExclVat', 'Subtotal (excl. VAT)'),
                        vatNote: t('group.summary.vatNote', 'VAT is calculated at checkout'),
                        subtotalInclVat: t('group.summary.subtotalInclVat', 'Subtotal (incl. VAT)'),
                        vatIncluded: t('group.summary.vatIncluded', 'VAT included in price'),
                        checkout: t('group.checkout', 'Checkout')
                    }}
                />)}


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
