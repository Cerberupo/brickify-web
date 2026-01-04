import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
    Label
} from "@/components/ui";
import {type UpdateUserRequest} from '@/lib/types';

interface EditMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: {
        id: string;
        name: string;
        avatar?: string;
        imageSignedUrl?: string;
        imagePath?: string;
        description?: string;
    } | null;
    onUpdate: (userData: UpdateUserRequest) => Promise<void>;
}

export function EditMemberDialog({open, onOpenChange, member, onUpdate}: EditMemberDialogProps) {
    const {t} = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [newAvatar, setNewAvatar] = useState<string | null>(null);

    // Update form when member changes
    useEffect(() => {
        if (member) {
            setName(member.name || '');
            setDescription(member.description || '');
            setAvatar(member.imageSignedUrl || member.imagePath || member.avatar || null);
            setNewAvatar(null);
        }
    }, [member]);

    // Handle file input change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!member || !name.trim()) {
            return; // Member and name are required
        }

        // Description is optional, no validation needed

        setIsLoading(true);

        try {
            await onUpdate({
                id: member.id,
                name: name.trim(),
                avatar: newAvatar || avatar,
                description: description.trim() || undefined
            });

            // Close dialog on success
            onOpenChange(false);
        } catch (error) {
            console.error('Error updating member:', error);
            // Error handling is done in the parent component
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('group.editMember')}</DialogTitle>
                    <DialogDescription>
                        {t('group.editMember')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-6 py-4">
                        {/* Avatar upload section at the top */}
                        <div className="flex flex-row gap-4 items-start">
                            {/* Avatar upload area */}
                            <div className="flex-1">
                                <Label htmlFor="edit-avatar" className="block mb-2">
                                    {t('group.memberAvatar')}
                                </Label>
                                <div
                                    className={`
                                        border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center
                                        w-full min-h-40 cursor-pointer hover:border-primary transition-colors
                                        border-gray-300
                                    `}
                                    onClick={() => document.getElementById('edit-avatar')?.click()}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                            const file = e.dataTransfer.files[0];
                                            if (file.type.startsWith('image/')) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setNewAvatar(reader.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }
                                    }}
                                >
                                    {(newAvatar || avatar) ? (
                                        <img
                                            src={newAvatar || avatar || ''}
                                            alt="Avatar"
                                            className="max-w-full max-h-full object-contain rounded-md"
                                        />
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg"
                                                 className="h-10 w-10 text-gray-400 mb-2" fill="none"
                                                 viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                            </svg>
                                            <p className="text-sm text-gray-500 text-center">
                                                {t('group.dragImageHere', 'Click or drag image here')}
                                            </p>
                                        </>
                                    )}
                                    <input
                                        id="edit-avatar"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>
                                {/* Error message would go here if needed */}
                            </div>

                            {/* Explanatory text on the right */}
                            <div className="flex-1 flex flex-col justify-center h-full pt-10">
                                <p className="text-sm text-gray-500 mb-2">
                                    {t('group.imageRequirements', 'Upload a photo of the person to help us choose their style.')}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {t('group.changeImageOptional', 'Changing the image is optional.')}
                                </p>
                            </div>
                        </div>

                        {/* Name field */}
                        <div>
                            <Label htmlFor="edit-name" className="block mb-2">
                                {t('group.memberName')}
                            </Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('group.namePlaceholder')}
                                className="w-full"
                                required
                            />
                        </div>

                        {/* Description field */}
                        {/*
                        <div>
                            <Label htmlFor="edit-description" className="block mb-2">
                                {t('group.memberDescription')}
                            </Label>
                            <Textarea
                                id="edit-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('group.memberDescriptionPlaceholder')}
                                className="w-full min-h-[150px]"
                            />
                        </div>
                        */}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
                                disabled={isLoading}>
                            {t('group.cancel')}
                        </Button>
                        <Button type="submit" isLoading={isLoading}>
                            {t('group.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
