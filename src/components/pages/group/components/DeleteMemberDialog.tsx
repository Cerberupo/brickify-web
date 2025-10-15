import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    Button
} from "@/components/ui";

interface DeleteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    memberName: string;
    onConfirm: () => Promise<void>;
}

export function DeleteMemberDialog({ open, onOpenChange, memberName, onConfirm }: DeleteMemberDialogProps) {
    const { t } = useTranslation();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        
        try {
            await onConfirm();
            onOpenChange(false);
        } catch (error) {
            console.error('Error deleting member:', error);
            // Error handling is done in the parent component
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={(nextOpen) => {
            if (isDeleting) return; // prevent closing while deleting
            onOpenChange(nextOpen);
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('group.deleteConfirmation.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('group.deleteConfirmation.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        {t('group.deleteConfirmation.cancel')}
                    </AlertDialogCancel>
                    <Button 
                        onClick={handleConfirm} 
                        className="bg-red-500 hover:bg-red-600"
                        isLoading={isDeleting}
                    >
                        {t('group.deleteConfirmation.confirm')}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}