import React, {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
    Button,
    CardContent,
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
    Toaster
} from "@/components/ui";
import {
    addUserToGroup,
    createReferencePersonGroup,
    deleteReferencePersonGroup,
    deleteUserFromGroup,
    getGroupById,
    updateReferencePersonGroup,
    updateUserInGroup
} from '@/lib/services/groups';
import {payGroupWithCredits} from '@/lib/services/stripe';
import {getProfile} from '@/lib/services/auth';
import {toast} from 'sonner';
import {APP_ROUTES} from '@/constants/routes';
import {cn, navigate} from '@/lib/utils';
import {type AddUserRequest, type Group, type UpdateUserRequest} from '@/lib/types';
import {GROUP_STATUS} from '@/constants/uiConfig';
import {
    ConfirmDeleteDialog,
    ConfirmPaymentDialog,
    GroupedReferenceList,
    GroupHeader,
    GroupSummaryHeader,
    InlineMemberEditor,
    InlineTwoMembersEditor,
    OrderSummaryCard,
    StickyOverlay
} from './components';
import {useAuthContext} from '@/lib/stores/authStore';
import {buildEngraveBackFiles, buildEngraveFiles} from '@/lib/engrave/engraveFileBuilder';

export function GroupPage() {
    const {t} = useTranslation();
    const {user} = useAuthContext();
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

    // Payment confirmation dialog state
    const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isDownloadingEngrave, setIsDownloadingEngrave] = useState(false);
    const [isDownloadingEngraveBack, setIsDownloadingEngraveBack] = useState(false);
    const [backDialogOpen, setBackDialogOpen] = useState(false);
    const [coupleNames, setCoupleNames] = useState('Ana & Luis');
    const [weddingDate, setWeddingDate] = useState('12/06/2026');

    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        setCurrentPage(1);
        setSearchTerm('');
    }, [groupId]);

    const isPhotoMode = useMemo(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            return params.has('photo');
        } catch {
            return false;
        }
    }, []);

    const referenceJson = useMemo(() => ({
        layers: [
            {
                "layerName": "C10",
                "layerColor": "#FD4E75",
                "materialName": "Parámetros manuales",
                "detailId": "",
                "combinationId": "",
                "laserId": "219f5cf308be487fa8c56e36ecc2e1f5",
                "engraveParamFlag": 0,
                "thicknessParam": 0.0,
                "elementType": 1,
                "mode": 1,
                "scan": 1,
                "gasAssisted": 1,
                "gasAssistNum": 10,
                "bConstantPowerMode": false,
                "processNum": 1,
                "direction": 0,
                "fillMode": 0,
                "layerId": 10,
                "lineSpace": 0.10000000149011612,
                "startDown": 0.0,
                "autoDown": 0.0,
                "speed": 9999.9990234375,
                "power": 77.0,
                "output": true,
                "show": true,
                "cutFlag": false,
                "embossFlag": false,
                "cleanSpeed": 0.0,
                "cleanPower": 0.0,
                "overScanFlag": false,
                "overScanPercent": 0.02500000037252903,
                "lightSource": 1,
                "lighSpotPower": 10,
                "laserLevel": 0,
                "lightSourceId": "cf957412a2e947299331709a9b498de2",
                "isHandParams": true,
                "redPower": 0.0,
                "breakpointEnabled": false,
                "breakpointCount": 0,
                "breakpointLength": 0.30000001192092896
            },
            {
                "layerName": "C17",
                "layerColor": "#5E8AAD",
                "materialName": "Parámetros manuales",
                "detailId": "",
                "combinationId": "",
                "laserId": "219f5cf308be487fa8c56e36ecc2e1f5",
                "engraveParamFlag": 0,
                "thicknessParam": 0.0,
                "elementType": 1,
                "mode": 2,
                "scan": 1,
                "gasAssisted": 1,
                "gasAssistNum": 10,
                "bConstantPowerMode": true,
                "processNum": 3,
                "direction": 0,
                "fillMode": 0,
                "layerId": 17,
                "lineSpace": 0.10000000149011612,
                "startDown": 0.0,
                "autoDown": 0.0,
                "speed": 665.9999389648438,
                "power": 80.0,
                "output": true,
                "show": true,
                "cutFlag": false,
                "embossFlag": false,
                "cleanSpeed": 0.0,
                "cleanPower": 0.0,
                "overScanFlag": false,
                "overScanPercent": 0.02500000037252903,
                "lightSource": 1,
                "lighSpotPower": 10,
                "laserLevel": 0,
                "lightSourceId": "cf957412a2e947299331709a9b498de2",
                "isHandParams": true,
                "redPower": 0.0,
                "breakpointEnabled": true,
                "breakpointCount": 5,
                "breakpointLength": 0.60000001192092896
            },
            {
                "layerName": "C18",
                "layerColor": "#987A35",
                "materialName": "Parámetros manuales",
                "detailId": "",
                "combinationId": "",
                "laserId": "219f5cf308be487fa8c56e36ecc2e1f5",
                "engraveParamFlag": 0,
                "thicknessParam": 0.0,
                "elementType": 1,
                "mode": 1,
                "scan": 1,
                "gasAssisted": 1,
                "gasAssistNum": 10,
                "bConstantPowerMode": false,
                "processNum": 1,
                "direction": 0,
                "fillMode": 0,
                "layerId": 18,
                "lineSpace": 0.10000000149011612,
                "startDown": 0.0,
                "autoDown": 0.0,
                "speed": 9999.9990234375,
                "power": 77.0,
                "output": true,
                "show": true,
                "cutFlag": false,
                "embossFlag": false,
                "cleanSpeed": 0.0,
                "cleanPower": 0.0,
                "overScanFlag": false,
                "overScanPercent": 0.02500000037252903,
                "lightSource": 1,
                "lighSpotPower": 10,
                "laserLevel": 0,
                "lightSourceId": "cf957412a2e947299331709a9b498de2",
                "isHandParams": true,
                "redPower": 0.0,
                "breakpointEnabled": false,
                "breakpointCount": 0,
                "breakpointLength": 0.30000001192092896
            }
        ],
        canvasName: 'Untitled',
        version: 'V2.6.0',
        engraveID: 'template-engrave-id',
        platform: 3,
        originCorner: 1,
        items: [
            {
                id: 'template-1',
                type: 65548,
                x: 10,
                y: 10,
                z: 0,
                angle: 0,
                lastAngle: 0,
                lineType: 1,
                color: '#5E8AAD',
                width: 90,
                height: 50,
                layer: 17,
                engraveType: 2,
                isFill: false,
                fillColor: '#000000',
                sceneY: 380,
                pathArray: []
            },
            {
                id: 'template-2',
                type: 65548,
                x: 10,
                y: 10,
                z: 1,
                angle: 0,
                lastAngle: 0,
                lineType: 1,
                color: '#987A35',
                width: 90,
                height: 50,
                layer: 18,
                engraveType: 1,
                isFill: true,
                fillColor: '#000000',
                sceneY: 380,
                pathArray: []
            },
            {
                id: 'template-3',
                type: 65546,
                x: 20,
                y: 25,
                z: 1,
                angle: 0,
                lastAngle: 0,
                lineType: 1,
                color: '#FD4E75',
                width: 48,
                height: 12,
                layer: 10,
                engraveType: 1,
                isFill: true,
                fillColor: '#FD4E75',
                text: 'Template Name',
                lastText: 'Template Name',
                fontSize: 20,
                lastFontSize: 20,
                initFontSize: 20,
                fontFamily: 'Yu Gothic UI',
                cmdArray: {},
                sceneY: 380,
                pathArray: []
            }
        ]
    }), []);

    const individualReferenceJson = useMemo(() => {
        const base = JSON.parse(JSON.stringify(referenceJson));
        // Individual users use a smaller SVG template
        // Original was 90x50, let's try 60x35
        if (base.items[0]) {
            base.items[0].width = 60;
            base.items[0].height = 35;
        }
        if (base.items[1]) {
            base.items[1].width = 60;
            base.items[1].height = 35;
        }
        if (base.items[2]) {
            // Adjust text template width as well
            base.items[2].width = 40;
            // Reduce font size for smaller template
            base.items[2].fontSize = 14;
            base.items[2].lastFontSize = 14;
            base.items[2].initFontSize = 14;
            // Adjust y position if needed, but the builder should handle it
        }
        return base;
    }, [referenceJson]);

    const handleDownloadEngrave = async () => {
        if (!group) return;
        try {
            setIsDownloadingEngrave(true);
            const svgUrls = [
                '/engrave-templates/cut.svg',
                '/engrave-templates/engrave.svg',
            ];

            const individuals = (group.referencePeople as any[]).filter(p => p.type === 'person');
            const groups_entries = (group.referencePeople as any[]).filter(p => p.type === 'group');

            const downloadFiles = async (people: any[], template: any, namePrefix: string, opts: any) => {
                if (people.length === 0) return;
                const files = await buildEngraveFiles(people, template, {
                    ...opts,
                    svgUrls,
                    curveSamples: 32
                });
                files.forEach((file, index) => {
                    const json = JSON.stringify(file, null, 2);
                    const blob = new Blob([json], {type: 'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${namePrefix}-${groupId}-${index + 1}.atom`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 0);
                });
            };

            // Download groups (using original template)
            await downloadFiles(groups_entries, referenceJson, 'engrave-groups', {
                perRow: 4,
                rowsPerFile: 7,
                gapX: 8,
                gapY: 2.5,
                textYOffset: 3, // Manual adjustment to lift text
                secondTextYOffset: 6
            });

            // Download individuals (using smaller template)
            await downloadFiles(individuals, individualReferenceJson, 'engrave-individuals', {
                perRow: 6, // We can fit more per row since they are smaller
                rowsPerFile: 10,
                gapX: 8,
                gapY: 2.5,
                textYOffset: -2, // Manual adjustment to lift text
                secondTextYOffset: -2
            });

        } catch (error) {
            console.error('Error building engrave files:', error);
            toast.error(t('group.errorBuildingEngrave', 'Failed to build engrave files.'));
        } finally {
            setIsDownloadingEngrave(false);
        }
    };

    const handleDownloadEngraveBack = async () => {
        if (!group) return;
        try {
            setIsDownloadingEngraveBack(true);
            const svgUrls = [
                '/engrave-templates/engrave.svg',
                '/engrave-templates/engrave.svg'
            ];

            const individuals = (group.referencePeople as any[]).filter(p => p.type === 'person');
            const groups_entries = (group.referencePeople as any[]).filter(p => p.type === 'group');

            const downloadBackFiles = async (people: any[], template: any, namePrefix: string, opts: any) => {
                if (people.length === 0) return;
                const files = await buildEngraveBackFiles(people, template, {
                    ...opts,
                    svgUrls,
                    curveSamples: 32,
                    backNames: coupleNames,
                    backDate: weddingDate
                });
                files.forEach((file, index) => {
                    const json = JSON.stringify(file, null, 2);
                    const blob = new Blob([json], {type: 'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${namePrefix}-${groupId}-${index + 1}.atom`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 0);
                });
            };

            // Download groups back
            await downloadBackFiles(groups_entries, referenceJson, 'engrave-back-groups', {
                perRow: 4,
                rowsPerFile: 7,
                gapX: 8,
                gapY: 2.5,
                backTextYOffset: -1.5 // Consistent with front group offset if needed
            });

            // Download individuals back
            await downloadBackFiles(individuals, individualReferenceJson, 'engrave-back-individuals', {
                perRow: 6,
                rowsPerFile: 10,
                gapX: 8,
                gapY: 2.5,
                backTextYOffset: 1 // Consistent with front individual offset
            });

        } catch (error) {
            console.error('Error building engrave back files:', error);
            toast.error(t('group.errorBuildingEngrave', 'Failed to build engrave files.'));
        } finally {
            setIsDownloadingEngraveBack(false);
        }
    };

    const matchesSearch = (entry: any, query: string) => {
        if (!query) return true;
        const q = query.toLowerCase();
        const name = typeof entry?.name === 'string' ? entry.name.toLowerCase() : '';
        if (name.includes(q)) return true;
        if (entry?.type === 'group' && Array.isArray(entry.people)) {
            return entry.people.some((p: any) => (p?.name || '').toLowerCase().includes(q));
        }
        return false;
    };

    const filteredEntries = (group?.referencePeople || []).filter((entry: any) => matchesSearch(entry, searchTerm));
    const totalPages = Math.max(1, Math.ceil(filteredEntries.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pagedEntries = filteredEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const shouldShowPagination = (group?.referencePeople?.length || 0) > ITEMS_PER_PAGE;

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

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
    }, [t]);

    // Poll group details every 15s while status is inAssembly or inProcess
    useEffect(() => {

        console.log('polling group details');
        if (!groupId) return;
        const shouldPoll = (s?: string | null) => s === 'inAssembly' || s === 'inProcess';
        if (!shouldPoll(group?.status)) {
            return; // no polling unless inAssembly or inProcess
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
                // Stop polling automatically if status changed out of active states
                if (!shouldPoll(fresh?.status) && intervalId != null) {
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

    const handlePayWithCredits = async () => {
        try {
            setIsPaying(true);
            await payGroupWithCredits(groupId);
            toast.success(t('checkout.payment_success'));
            // Actualizar el grupo para ver el nuevo estado (inProcess/inAssembly)
            const fresh = await getGroupById(groupId);
            setGroup(fresh);
            // Actualizar el perfil del usuario para ver el nuevo saldo
            await getProfile();
            setConfirmPaymentOpen(false);
        } catch (error: any) {
            console.error('Error paying with credits:', error);
            const msg = error?.message || t('checkout.payment_error');
            toast.error(msg);
        } finally {
            setIsPaying(false);
        }
    };

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
            <Toaster position="top-right"/>
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
                            <div className="flex gap-2">
                                {user?.canAddUserGroups && (
                                    <Button variant="outline" onClick={() => setAddingMode('pair')}>
                                        {t('group.addPair')}
                                    </Button>
                                )}
                                <Button onClick={() => setAddingMode('single')}>{t('group.addMember')}</Button>
                            </div>
                        ) : null}
                    />
                    {/** Precio por persona ahora se calcula directamente en el resumen inferior (OrderSummaryCard) */}
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Top Section: Group Details (moved to sticky bar) */}

                {/* Middle Section: Group Members */}
                <CardContent className="px-0 sm:px-6">
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
                            {(shouldShowPagination || isPhotoMode) && (
                                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                                    {isPhotoMode && (
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleDownloadEngrave}
                                                disabled={isDownloadingEngrave}
                                            >
                                                {isDownloadingEngrave
                                                    ? t('group.buildingEngrave', 'Building files...')
                                                    : t('group.downloadEngrave', 'Download engrave files')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setBackDialogOpen(true)}
                                                disabled={isDownloadingEngraveBack}
                                            >
                                                {t('group.downloadEngraveBack', 'Download back')}
                                            </Button>
                                        </div>
                                    )}
                                    <Input
                                        placeholder={t('group.searchMembers', 'Search members')}
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="sm:max-w-xs"
                                    />
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            aria-label={t('group.prev', 'Previous page')}
                                        >
                                            ‹
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
                                                <Button
                                                    key={page}
                                                    variant={page === currentPage ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(page)}
                                                    aria-current={page === currentPage ? 'page' : undefined}
                                                >
                                                    {page}
                                                </Button>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            aria-label={t('group.next', 'Next page')}
                                        >
                                            ›
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <GroupedReferenceList
                                groupId={groupId}
                                entries={pagedEntries as any}
                                group={group}
                                setGroup={setGroup}
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
                            {shouldShowPagination && (
                                <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        aria-label={t('group.prev', 'Previous page')}
                                    >
                                        ‹
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
                                            <Button
                                                key={page}
                                                variant={page === currentPage ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setCurrentPage(page)}
                                                aria-current={page === currentPage ? 'page' : undefined}
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        aria-label={t('group.next', 'Next page')}
                                    >
                                        ›
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {addingMode === 'none' && !editingGroup && !memberToEdit && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 mb-4">{t('group.addFirstMember')}</p>
                                    <div className="flex justify-center gap-2">
                                        {user?.canAddUserGroups && (
                                            <Button variant="outline"
                                                    onClick={() => setAddingMode('pair')}>{t('group.addTwoMembers')}</Button>
                                        )}
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
                    entries={(group.referencePeople as any[]) || []}
                    canEdit={canEdit}
                    onCheckout={() => setConfirmPaymentOpen(true)}
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

            <ConfirmPaymentDialog
                open={confirmPaymentOpen}
                onOpenChange={setConfirmPaymentOpen}
                onConfirm={handlePayWithCredits}
                isProcessing={isPaying}
                totalMembers={totalMembers}
                costPerMember={100}
                totalCost={totalMembers * 100}
                currentBalance={user?.balance || 0}
            />

            <Dialog open={backDialogOpen} onOpenChange={setBackDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('group.downloadEngraveBack', 'Download back')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input
                            placeholder={t('group.coupleNames', 'Couple names')}
                            value={coupleNames}
                            onChange={(e) => setCoupleNames(e.target.value)}
                        />
                        <Input
                            placeholder={t('group.weddingDate', 'Wedding date')}
                            value={weddingDate}
                            onChange={(e) => setWeddingDate(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBackDialogOpen(false)}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={async () => {
                                await handleDownloadEngraveBack();
                                setBackDialogOpen(false);
                            }}
                            disabled={isDownloadingEngraveBack}
                        >
                            {isDownloadingEngraveBack
                                ? t('group.buildingEngrave', 'Building files...')
                                : t('group.downloadEngraveBack', 'Download back')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
