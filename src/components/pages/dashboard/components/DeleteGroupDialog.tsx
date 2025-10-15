import React from 'react';
import {useTranslation} from 'react-i18next';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    Button,
} from "@/components/ui";

interface DeleteGroupDialogProps {
    /**
     * Whether the dialog is open
     */
    open: boolean;
    /**
     * Callback when the dialog open state changes
     */
    onOpenChange: (open: boolean) => void;
    /**
     * Callback when the delete action is confirmed
     */
    onConfirm: () => void;
    /**
     * Whether the delete action is in progress
     */
    isDeleting?: boolean;
}

/**
 * Dialog component for confirming group deletion
 */
export function DeleteGroupDialog({open, onOpenChange, onConfirm, isDeleting = false}: DeleteGroupDialogProps) {
    const {t} = useTranslation();

    return (
        <AlertDialog open={open} onOpenChange={(nextOpen) => {
            if (isDeleting) return; // prevent closing while deleting
            onOpenChange(nextOpen);
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('dashboard.deleteConfirmation.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('dashboard.deleteConfirmation.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        {t('dashboard.deleteConfirmation.cancel')}
                    </AlertDialogCancel>
                    <Button 
                        onClick={onConfirm} 
                        className="bg-red-500 hover:bg-red-600"
                        isLoading={isDeleting}
                    >
                        {t('dashboard.deleteConfirmation.confirm')}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
