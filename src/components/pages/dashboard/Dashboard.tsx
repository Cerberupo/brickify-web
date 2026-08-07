import React, {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {CreateGroupModal, GroupCard, Toaster} from '@/components';
import {Button, Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui';
import {ChevronLeft, ChevronRight, Plus, UsersRound} from 'lucide-react';
import {createGroup, getGroups, updateGroup} from '@/lib/services';
import {toast} from 'sonner';
import type {Group} from '@/lib/types/group';
import {MAX_PENDING_GROUPS} from '@/constants/uiConfig';
import {hasGroupAlreadyPaidStatus} from "@/lib";
import {useAuthContext} from '@/lib/stores/authStore';
import {useOnboarding} from '@/lib/hooks/useOnboarding';
import {OnboardingTooltip} from '@/components/common/OnboardingTooltip';

const ITEMS_PER_PAGE = 9;

export function DashboardPage() {
    const {t} = useTranslation();
    const {user} = useAuthContext();
    const onboarding = useOnboarding();

    // Show the welcome credits banner while the balance still comes only from the gift
    // (gift granted and balance not above the welcome amount, i.e., no recharges yet)
    const showWelcomeCreditsBanner = Boolean(
        user?.welcomeCreditsGrantedAt && (user?.balance ?? 0) > 0 && (user?.balance ?? 0) <= 100
    );

    // State for controlling the modal visibility
    const [isModalOpen, setIsModalOpen] = useState(false);
    // State for editing selected group
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    // State for storing groups
    const [groups, setGroups] = useState<Group[]>([]);
    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // State for loading status
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Count groups that have not paid yet
    const pendingGroupsCount = useMemo(() => {
        // This count only considers groups currently loaded in the frontend.
        // For strict enforcement, the backend should probably check this.
        return groups.filter(group => !hasGroupAlreadyPaidStatus(group)).length;
    }, [groups]);

    // Check if button should be disabled
    const isCreateButtonDisabled = pendingGroupsCount > MAX_PENDING_GROUPS;

    const handleOpenModal = () => {
        setSelectedGroup(null);
        setIsModalOpen(true);
        if (onboarding.active && onboarding.step === 1) {
            onboarding.setTourStep(2);
        }
    };

    const handleOpenEditModal = (group: Group) => {
        setSelectedGroup(group);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedGroup(null);
    };

    // Fetch groups on component mount or page change
    useEffect(() => {
        fetchGroupsByPage(page);
    }, [page]);

    const fetchGroupsByPage = async (pageNumber: number) => {
        try {
            if (pageNumber === 1) setIsInitialLoading(true);
            else setIsLoading(true);

            const response = await getGroups(pageNumber, ITEMS_PER_PAGE);
            setGroups(response.groups);
            setTotalPages(response.pages);

            if (typeof window !== 'undefined') {
                const isCompleted = localStorage.getItem('brickify_onboarding_completed') === 'true';
                const isActive = localStorage.getItem('brickify_onboarding_active') === 'true';
                if (response.total > 0) {
                    if (isActive || !isCompleted) {
                        onboarding.stopTour();
                    }
                } else if (response.total === 0 && !isCompleted && !isActive) {
                    onboarding.startTour();
                }
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
            toast.error(t('dashboard.errorFetchingGroups'));
        } finally {
            setIsInitialLoading(false);
            setIsLoading(false);
        }
    };

    // Handler for page change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    };

    // Handler for form submission
    const handleSubmit = async (name: string, description: string, groupType: string) => {
        try {
            setIsLoading(true);

            // Call the API to create the group
            await createGroup({name, description, groupType});

            // Show success message
            toast.success(t('dashboard.groupCreated'));

            // Reset to first page and fetch
            if (page === 1) {
                await fetchGroupsByPage(1);
            } else {
                setPage(1);
            }

            // Close the modal after submission
            handleCloseModal();

            if (onboarding.active && onboarding.step === 2) {
                onboarding.setTourStep(3);
            }
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
            await updateGroup(id, {name, description});
            toast.success(t('dashboard.groupUpdated', 'Group updated successfully'));
            await fetchGroupsByPage(page);
            handleCloseModal();
        } catch (error) {
            console.error('Error updating group:', error);
            toast.error(t('dashboard.errorCreatingGroup'));
        } finally {
            setIsLoading(false);
        }
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="flex justify-center items-center gap-2 mt-10">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || isLoading}
                >
                    <ChevronLeft size={16}/>
                </Button>

                {startPage > 1 && (
                    <>
                        <Button
                            variant={page === 1 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(1)}
                            disabled={isLoading}
                        >
                            1
                        </Button>
                        {startPage > 2 && <span className="text-gray-400">...</span>}
                    </>
                )}

                {pages.map(p => (
                    <Button
                        key={p}
                        variant={page === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(p)}
                        disabled={isLoading}
                        className={page === p ? 'pointer-events-none' : ''}
                    >
                        {p}
                    </Button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
                        <Button
                            variant={page === totalPages ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(totalPages)}
                            disabled={isLoading}
                        >
                            {totalPages}
                        </Button>
                    </>
                )}

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages || isLoading}
                >
                    <ChevronRight size={16}/>
                </Button>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 py-6">
            <Toaster position="top-right"/>
            {showWelcomeCreditsBanner && (
                <div className="bg-yellow-100 text-yellow-900 rounded-md px-4 py-3 mb-6 text-sm">
                    {t('dashboard.welcomeCreditsBanner', '🎁 You have your welcome credits available: create your first minifigure for free!')}
                </div>
            )}
            <div className="mb-8">
                {isInitialLoading ? (
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
                                            id="tour-create-group-btn"
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
                            {groups.map((group, index) => (
                                <GroupCard key={group.id} group={group} onEdit={handleOpenEditModal}
                                           isFirst={index === 0}/>
                            ))}
                        </div>
                        {renderPagination()}
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
                                        id="tour-create-group-btn"
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
                initialValues={selectedGroup ? {
                    id: selectedGroup.id,
                    name: selectedGroup.name,
                    description: selectedGroup.description,
                    groupType: selectedGroup.groupType,
                } : undefined}
                onSubmitEdit={handleEditSubmit}
                onboardingActive={onboarding.active}
            />

            {onboarding.active && onboarding.step === 1 && (
                <OnboardingTooltip
                    targetSelector="#tour-create-group-btn"
                    step={1}
                    totalSteps={7}
                    content={t('onboarding.step1', '¡Bienvenido a Brickify! Crea tu primera colección para organizar tus pedidos en grupos (ya sea para tus familiares, amigos, etc.). Haz clic aquí para comenzar.')}
                    placement="bottom"
                    onNext={onboarding.nextStep}
                    onBack={onboarding.prevStep}
                    onSkip={onboarding.stopTour}
                />
            )}

            {onboarding.active && onboarding.step === 2 && (
                <OnboardingTooltip
                    targetSelector="#tour-group-modal-content"
                    step={2}
                    totalSteps={7}
                    content={t('onboarding.step2', 'Añade un título descriptivo y una breve descripción para identificar fácilmente este grupo.')}
                    placement="bottom"
                    onNext={onboarding.nextStep}
                    onBack={onboarding.prevStep}
                    onSkip={onboarding.stopTour}
                />
            )}

            {onboarding.active && onboarding.step === 3 && (
                <OnboardingTooltip
                    targetSelector="#tour-group-card-first"
                    step={3}
                    totalSteps={7}
                    content={t('onboarding.step3', '¡Excelente! Tu colección se ha creado. Haz clic en la tarjeta para entrar a ver los detalles y empezar a organizar los miembros.')}
                    placement="bottom"
                    onNext={onboarding.nextStep}
                    onBack={onboarding.prevStep}
                    onSkip={onboarding.stopTour}
                />
            )}
        </div>
    );
}
