import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Progress
} from "@/components/ui";
import {DeleteGroupDialog} from './DeleteGroupDialog';
import {cn, hasGroupAlreadyPaidStatus, navigate} from "@/lib/utils";
import type {GroupCardProps} from '../types';
import {GROUP_STATUS, MIN_USERS} from '@/constants/uiConfig';
import {APP_ROUTES} from '@/constants/routes';
import {Trash2, Edit2} from 'lucide-react';
import {deleteGroup} from '@/lib/services/groups';
import {toast} from 'sonner';


export function GroupCard({group, onEdit}: GroupCardProps) {
    const {t} = useTranslation();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get status configuration
    const statusConf = GROUP_STATUS[group.status];

    // Determine if we need to show remaining users or completed users
    const needsMoreUsers = group.totalUsers < MIN_USERS;

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
        <>
            <Card
                className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-1"
                onClick={() => navigate(APP_ROUTES.GROUP, {id: group.id})}>
                <CardHeader>
                    <div className="flex justify-between items-start">
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
                                    onClick={(e) => { e.stopPropagation(); onEdit?.(group); }}
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

                    {/* User avatars */}
                    <div>
                        <p className="text-sm font-medium mb-2">{t('dashboard.groupMembers')}</p>
                        <div className="flex -space-x-2 overflow-hidden">
                            {group.referencePeople.length > 0 ? (
                                group.referencePeople.map((user) => (
                                    <Avatar key={user.id} className="border-2 border-background">
                                        {user.avatar ? (
                                            <AvatarImage src={user.avatar} alt={user.name}/>
                                        ) : (
                                            <AvatarFallback>
                                                {user.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                ))
                            ) : (
                                <Avatar className="border-2 border-background">
                                    <AvatarFallback>
                                        {t('dashboard.emptyGroup', 'EG')}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    </div>

                    {/* Group status */}
                    <div className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium inline-block", statusConf.color)}>
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
