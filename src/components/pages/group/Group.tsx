import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress} from "@/components/ui";
import {addUserToGroup, deleteUserFromGroup, getGroupById, updateUserInGroup} from '@/lib/services/groups';
import {toast} from 'sonner';
import {APP_ROUTES} from '@/constants/routes';
import {cn, navigate} from '@/lib/utils';
import {type AddUserRequest, type Group, type UpdateUserRequest} from '@/lib/types';
import {GROUP_STATUS, MIN_USERS} from '@/constants/uiConfig';
import {AddMemberDialog, DeleteMemberDialog, EditMemberDialog, MemberList} from './components';

export function GroupPage() {
    const {t} = useTranslation();
    const [group, setGroup] = useState<Group | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [groupId, setGroupId] = useState<string>('');

    // State for edit member dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [memberToEdit, setMemberToEdit] = useState<{
        id: string;
        name: string;
        email?: string;
        avatar?: string;
    } | null>(null);

    // State for delete member dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);

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
            toast.error(t('group.errorAddingMember'));
            throw error;
        }
    };

    // Handler for editing a member
    const handleEditMember = async (userData: UpdateUserRequest) => {
        try {
            const updatedUser = await updateUserInGroup(groupId, userData);

            // Update the group with the updated member
            if (group) {
                setGroup({
                    ...group,
                    referencePeople: group.referencePeople.map(member =>
                        member.id === updatedUser.id ? updatedUser : member
                    )
                });
            }

            toast.success(t('group.memberUpdated'));
        } catch (error) {
            console.error('Error updating member:', error);
            toast.error(t('group.errorUpdatingMember'));
            throw error;
        }
    };

    // Handler for deleting a member
    const handleDeleteMember = async () => {
        if (!memberToDelete) return;

        try {
            await deleteUserFromGroup(groupId, memberToDelete.id);

            // Update the group without the deleted member
            if (group) {
                setGroup({
                    ...group,
                    referencePeople: group.referencePeople.filter(member =>
                        member.id !== memberToDelete.id
                    ),
                    totalUsers: group.totalUsers - 1
                });
            }

            toast.success(t('group.memberDeleted'));
        } catch (error) {
            console.error('Error deleting member:', error);
            toast.error(t('group.errorDeletingMember'));
            throw error;
        }
    };

    // Get status configuration
    const statusConf = GROUP_STATUS[group.status];

    // Determine if we need to show remaining users or completed users
    const needsMoreUsers = group.totalUsers < MIN_USERS;

    // Calculate completion percentage
    let completionPercentage;
    if (needsMoreUsers) {
        // If we need more users, calculate percentage based on how many users we have out of the minimum
        completionPercentage = group.totalUsers === 0 ? 0 : Math.round((group.totalUsers / MIN_USERS) * 100);
    } else {
        // If we have enough users, calculate percentage based on how many users are completed
        completionPercentage = group.totalUsers === 0 ? 0 : Math.round((group.usersCompleted / group.totalUsers) * 100);
    }

    return (
        <div className="container mx-auto p-4 py-6">
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
                        <div className="flex flex-col md:flex-row gap-6 items-start">
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

                                {/* User completion status */}
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">
                                            {needsMoreUsers
                                                ? t('dashboard.usersRemaining', {remaining: group.totalUsers, min: MIN_USERS})
                                                : t('dashboard.usersCompleted', {
                                                    completed: group.usersCompleted,
                                                    total: group.totalUsers
                                                })}
                                        </span>
                                    </div>
                                    <Progress value={completionPercentage} className="w-full"/>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Middle Section: Group Members */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t('group.members')}</CardTitle>
                            <CardDescription>
                                {group.totalUsers > 0
                                    ? t('dashboard.groupMembers')
                                    : t('group.noMembers')}
                            </CardDescription>
                        </div>
                        <AddMemberDialog onAdd={handleAddMember}/>
                    </CardHeader>
                    <CardContent>
                        {group.referencePeople.length > 0 ? (
                            <div className="space-y-4">
                                <MemberList
                                    members={group.referencePeople}
                                    onEdit={(memberId) => {
                                        const member = group.referencePeople.find(m => m.id === memberId);
                                        if (member) {
                                            setMemberToEdit(member);
                                            setEditDialogOpen(true);
                                        }
                                    }}
                                    onDelete={(memberId) => {
                                        const member = group.referencePeople.find(m => m.id === memberId);
                                        if (member) {
                                            setMemberToDelete({
                                                id: member.id,
                                                name: member.name
                                            });
                                            setDeleteDialogOpen(true);
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500 mb-4">{t('group.addFirstMember')}</p>
                                <AddMemberDialog onAdd={handleAddMember}/>
                            </div>
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

                {/* Edit Member Dialog */}
                <EditMemberDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    member={memberToEdit}
                    onUpdate={handleEditMember}
                />

                {/* Delete Member Dialog */}
                <DeleteMemberDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    memberName={memberToDelete?.name || ''}
                    onConfirm={handleDeleteMember}
                />
            </div>
        </div>
    );
}
