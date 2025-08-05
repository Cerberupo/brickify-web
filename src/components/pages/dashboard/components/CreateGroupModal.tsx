import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Input,
    Textarea,
    Label
} from '@/components/ui';
import type { CreateGroupModalProps } from '../types';

export function CreateGroupModal({ isOpen, onClose, onSubmit }: CreateGroupModalProps) {
    const { t } = useTranslation();

    // State for form fields
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');

    // Handler for closing the modal
    const handleClose = () => {
        // Reset form fields
        setGroupName('');
        setGroupDescription('');
        onClose();
    };

    // Handler for form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Call the onSubmit callback with the form values
        onSubmit(groupName, groupDescription);

        // Reset form fields and close modal
        setGroupName('');
        setGroupDescription('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('dashboard.createGroup')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('dashboard.groupName')}</Label>
                            <Input
                                id="name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder={t('dashboard.groupNamePlaceholder')}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">{t('dashboard.groupDescription')}</Label>
                            <Textarea
                                id="description"
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                placeholder={t('dashboard.groupDescriptionPlaceholder')}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit">
                            {t('common.create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
