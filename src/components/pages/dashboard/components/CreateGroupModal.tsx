import React, { useEffect } from 'react';
import {useTranslation} from 'react-i18next';
import {useForm} from 'react-hook-form';
import {
    Button,
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Textarea
} from '@/components/ui';
import type {CreateGroupModalProps} from '../types';
import {GROUP_TYPE_LIST, type GroupType} from '@/constants/group';

// Define form type
type CreateGroupFormValues = {
    name: string;
    description: string;
    groupType: GroupType;
};

export function CreateGroupModal({isOpen, onClose, onSubmit, mode = 'create', initialValues, onSubmitEdit}: CreateGroupModalProps) {
    const {t} = useTranslation();

    // Set up form with react-hook-form
    const {
        register,
        handleSubmit,
        reset,
        formState: {errors},
        setValue
    } = useForm<CreateGroupFormValues>({
        defaultValues: {
            name: initialValues?.name ?? '',
            description: initialValues?.description ?? '',
            groupType: undefined
        }
    });

    // Reset form when switching to edit mode with initial values
    useEffect(() => {
        if (isOpen && mode === 'edit' && initialValues) {
            reset({ name: initialValues.name, description: initialValues.description, groupType: undefined });
        }
    }, [isOpen, mode, initialValues, reset]);

    // Handler for closing the modal
    const handleClose = () => {
        // Reset form fields
        reset();
        onClose();
    };

    // Handler for form submission
    const onSubmitForm = (data: CreateGroupFormValues) => {
        if (mode === 'edit' && onSubmitEdit && initialValues?.id) {
            onSubmitEdit(initialValues.id, data.name, data.description);
        } else {
            // Create flow
            onSubmit(data.name, data.description, data.groupType);
        }
        // Reset form fields and close modal
        reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? t('dashboard.editGroup', 'Edit Group') : t('dashboard.createGroup')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmitForm)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('dashboard.groupName')}</Label>
                            <Input
                                id="name"
                                {...register("name", {
                                    required: t('dashboard.groupNameRequired') as string
                                })}
                                placeholder={t('dashboard.groupNamePlaceholder')}
                                aria-invalid={errors.name ? "true" : "false"}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">{t('dashboard.groupDescription')}</Label>
                            <Textarea
                                id="description"
                                {...register("description", {
                                    required: t('dashboard.groupDescriptionRequired') as string
                                })}
                                placeholder={t('dashboard.groupDescriptionPlaceholder')}
                                aria-invalid={errors.description ? "true" : "false"}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description.message}</p>
                            )}
                        </div>
                        {mode === 'create' && (
                            <div className="grid gap-2">
                                <Label htmlFor="groupType">{t('dashboard.groupType')}</Label>
                                {/* Hidden input to register with RHF for validation */}
                                <input type="hidden"
                                       id="groupType" {...register('groupType', {required: t('dashboard.groupTypeRequired') as string})} />
                                <Select
                                    onValueChange={(value) => setValue('groupType', value as GroupType, {shouldValidate: true})}>
                                    <SelectTrigger aria-invalid={errors.groupType ? 'true' : 'false'} className="w-full">
                                        <SelectValue placeholder={t('dashboard.groupTypePlaceholder')}/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GROUP_TYPE_LIST.map((value) => {
                                            return (
                                                <SelectItem key={value} value={value}>
                                                    {t(`dashboard.groupTypeOptions.${value}`)}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                {errors.groupType && (
                                    <p className="text-sm text-red-500">{errors.groupType.message as string}</p>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit">
                            {mode === 'edit' ? t('common.save', 'Save') : t('common.create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
