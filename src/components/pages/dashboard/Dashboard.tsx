import React, {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {CreateGroupModal, GroupCard} from '@/components';
import {Button, Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui';
import {Plus, UsersRound} from 'lucide-react';
import {createGroup, getGroups, updateGroup} from '@/lib/services';
import {toast} from 'sonner';
import type {Group} from '@/lib/types/group';
import {MAX_PENDING_GROUPS} from '@/constants/uiConfig';
import {hasGroupAlreadyPaidStatus} from "@/lib";


export function DashboardPage() {
    const {t} = useTranslation();

    // State for controlling the modal visibility
    const [isModalOpen, setIsModalOpen] = useState(false);
    // State for editing selected group
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    // State for storing groups
    const [groups, setGroups] = useState<Group[]>([]);

    // State for loading status
    const [isLoading, setIsLoading] = useState(false);

    // Count groups that have not paid yet
    const pendingGroupsCount = useMemo(() => {
        return groups.filter(group => !hasGroupAlreadyPaidStatus(group)).length;
    }, [groups]);

    // Check if button should be disabled
    const isCreateButtonDisabled = pendingGroupsCount > MAX_PENDING_GROUPS;

    // Fetch groups on component mount
    useEffect(() => {
        fetchGroups();
    }, []);

    // Function to fetch groups
    const fetchGroups = async () => {
        try {
            setIsLoading(true);
            const fetchedGroups = await getGroups();
            console.log('fetchedGroups', fetchedGroups);
            setGroups(fetchedGroups);
        } catch (error) {
            console.error('Error fetching groups:', error);
            toast.error(t('dashboard.errorFetchingGroups'));
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for opening the modal
    const handleOpenModal = () => {
        setSelectedGroup(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (group: Group) => {
        setSelectedGroup(group);
        setIsModalOpen(true);
    };

    // Handler for closing the modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedGroup(null);
    };

    // Handler for form submission
    const handleSubmit = async (name: string, description: string, groupType: string) => {
        try {
            setIsLoading(true);

            // Call the API to create the group
            const response = await createGroup({name, description, groupType});

            // Show success message
            toast.success(t('dashboard.groupCreated'));

            // Fetch updated groups
            await fetchGroups();

            // Close the modal after submission
            handleCloseModal();
        } catch (error) {
            console.error('Error creating group:', error);
            toast.error(t('dashboard.errorCreatingGroup'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSubmit = async (id: string, name: string, description: string) => {
        try {
            setIsLoading(true);
            await updateGroup(id, { name, description });
            toast.success(t('dashboard.groupUpdated', 'Group updated successfully'));
            await fetchGroups();
            handleCloseModal();
        } catch (error) {
            console.error('Error updating group:', error);
            toast.error(t('dashboard.errorCreatingGroup'));
        } finally {
            setIsLoading(false);
        }
    };

    console.log(groups);

    return (
        <div className="container mx-auto p-4 py-6">

            <div className="mb-8">


                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                ) : groups.length > 0 ? (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">{t('dashboard.myGroups')}</h2>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <Button
                                            className="flex items-center gap-2"
                                            onClick={handleOpenModal}
                                            disabled={isCreateButtonDisabled}
                                        >
                                            <Plus size={16}/>
                                            {t('dashboard.createGroup')}
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {isCreateButtonDisabled && (
                                    <TooltipContent>
                                        {t('dashboard.tooManyPendingGroups')}
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groups.map(group => (
                                <GroupCard key={group.id} group={group} onEdit={handleOpenEditModal}/>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="bg-gray-100 p-6 rounded-full mb-6">
                            <UsersRound size={64} className="text-primary"/>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{t('dashboard.noGroups')}</h3>
                        <p className="text-gray-600 mb-6 max-w-md">
                            {t('dashboard.createFirstGroup')}
                        </p>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button
                                        className="flex items-center gap-2"
                                        onClick={handleOpenModal}
                                        disabled={isCreateButtonDisabled}
                                    >
                                        <Plus size={16}/>
                                        {t('dashboard.createGroup')}
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {isCreateButtonDisabled && (
                                <TooltipContent>
                                    {t('dashboard.tooManyPendingGroups')}
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </div>
                )}
            </div>

            {/* Modal for creating a new group */}
            <CreateGroupModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                mode={selectedGroup ? 'edit' : 'create'}
                initialValues={selectedGroup ? { id: selectedGroup.id, name: selectedGroup.name, description: selectedGroup.description } : undefined}
                onSubmitEdit={handleEditSubmit}
            />
        </div>
    );
}
