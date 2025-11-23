import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Toaster} from "@/components/ui";
import {DeleteGroupDialog} from './DeleteGroupDialog';
import {cn, hasGroupAlreadyPaidStatus, navigate} from "@/lib/utils";
import type {GroupCardProps} from '../types';
import {GROUP_STATUS} from '@/constants/uiConfig';
import {APP_ROUTES} from '@/constants/routes';
import {Edit2, Trash2} from 'lucide-react';
import {deleteGroup} from '@/lib/services/groups';
import {toast} from 'sonner';
import ReferencePeopleAvatars from '@/components/common/ReferencePeopleAvatars';


export function GroupCard({group, onEdit}: GroupCardProps) {
    const {t} = useTranslation();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get status configuration
    const statusConf = GROUP_STATUS[group.status];

    // Flatten referencePeople so subgroup members are included in the avatar list
    const flatMembers = (group.referencePeople as any[]).flatMap((entry: any) => {
        if (entry && entry.type === 'group' && Array.isArray(entry.people)) {
            return entry.people.filter(Boolean);
        }
        return [entry];
    });
    // Order: first those who have an image, then those who don't
    flatMembers.sort((a: any, b: any) => {
        const aHas = Boolean(a?.imageSignedUrl || a?.imagePath || a?.avatar);
        const bHas = Boolean(b?.imageSignedUrl || b?.imagePath || b?.avatar);
        if (aHas === bHas) return 0;
        return aHas ? -1 : 1;
    });
    const totalMembers = flatMembers.length;

    // Handle delete button click
    const handleDelete = (e: React.MouseEvent) => {
        // Stop event propagation to prevent card click
        e.stopPropagation();
        // Show delete confirmation dialog
        setShowDeleteDialog(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        try {
            // Set loading state
            setIsDeleting(true);

            // Call the API to delete the group
            await deleteGroup(group.id);

            // Show success message
            toast.success(t('dashboard.deleteSuccess', 'Group deleted successfully'));

            // Close the dialog
            setShowDeleteDialog(false);

            // Refresh the groups list
            // This will be handled by the parent component
            if (typeof window !== 'undefined') {
                // Trigger a page refresh to update the groups list
                window.location.reload();
            }
        } catch (error) {
            console.error('Error deleting group:', error);

            // Show error message
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('dashboard.deleteError', 'Failed to delete group. Please try again.')
            );

            // Close the dialog
            setShowDeleteDialog(false);
        } finally {
            // Reset loading state
            setIsDeleting(false);
        }
    };


    return (
        <>
            <Toaster position="top-right"/>
            <Card
                className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-1"
                onClick={() => navigate(APP_ROUTES.GROUP, {id: group.id})}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>{group.name}</CardTitle>
                            <CardDescription>{group.description}</CardDescription>
                        </div>
                        {!hasGroupAlreadyPaidStatus(group) && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit?.(group);
                                    }}
                                >
                                    <Edit2 className="h-4 w-4"/>
                                    <span className="sr-only">{t('dashboard.editGroup', 'Edit Group')}</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="h-4 w-4"/>
                                    <span className="sr-only">{t('dashboard.deleteGroup')}</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* User avatars */}
                    <div>
                        <p className="text-sm font-medium mb-2">{t('dashboard.groupMembers')} ({totalMembers})</p>
                        <div>
                            <ReferencePeopleAvatars entries={group.referencePeople as any[]} size={28} overlap/>
                        </div>
                    </div>

                    {/* Group status */}
                    <div
                        className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium inline-block", statusConf.color)}>
                        {t(statusConf.message)}
                    </div>
                </CardContent>

                {/* Show price if available */}
                {group.price && (
                    <CardFooter className="border-t pt-4">
                        <div className="flex justify-between w-full">
                            <span className="font-medium">{t('dashboard.groupPrice')}</span>
                            <span className="font-bold">{group.price.toFixed(2)} €</span>
                        </div>
                    </CardFooter>
                )}
            </Card>

            {/* Delete confirmation dialog */}
            <DeleteGroupDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    );
}
