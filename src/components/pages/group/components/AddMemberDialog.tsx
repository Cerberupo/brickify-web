import React, {useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useForm, Controller} from 'react-hook-form';
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Input,
    Label,
    Textarea,
    Checkbox
} from "@/components/ui";
import {type AddUserRequest} from '@/lib/types';

// Define form type
type AddMemberFormValues = {
    name: string;
    description?: string;
    avatar?: string;
    noImage: boolean;
    hairDescription?: string;
    faceDescription?: string;
};

interface AddMemberDialogProps {
    onAdd: (userData: AddUserRequest) => Promise<void>;
    trigger?: React.ReactNode;
}

export function AddMemberDialog({onAdd, trigger}: AddMemberDialogProps) {
    const {t} = useTranslation();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Set up form with react-hook-form
    const { 
        register, 
        handleSubmit, 
        control,
        reset,
        setValue,
        watch,
        formState: { errors } 
    } = useForm<AddMemberFormValues>({
        defaultValues: {
            name: '',
            description: '',
            avatar: '',
            noImage: false,
            hairDescription: '',
            faceDescription: ''
        }
    });

    // Handle file input change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setAvatarPreview(result);
                setValue('avatar', result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle file drop
    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    setAvatarPreview(result);
                    setValue('avatar', result);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const onSubmitForm = async (data: AddMemberFormValues) => {
        setIsLoading(true);

        try {
            await onAdd({
                name: data.name.trim(),
                avatar: data.noImage ? undefined : data.avatar,
                noImage: data.noImage || undefined,
                hairDescription: data.noImage ? data.hairDescription?.trim() : undefined,
                faceDescription: data.noImage ? data.faceDescription?.trim() : undefined,
                description: data.description?.trim()
            });

            // Reset form and close dialog on success
            reset();
            setAvatarPreview(null);
            setOpen(false);
        } catch (error) {
            console.error('Error adding member:', error);
            // Error handling is done in the parent component
        } finally {
            setIsLoading(false);
        }
    };

    const watchNoImage = watch('noImage');

    // Clear avatar when user selects no image
    useEffect(() => {
        if (watchNoImage) {
            setValue('avatar', '');
            setAvatarPreview(null);
        }
    }, [watchNoImage, setValue]);

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (!newOpen) {
                reset();
                setAvatarPreview(null);
            }
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        {t('group.addMember')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('group.addMember')}</DialogTitle>
                    <DialogDescription>
                        {t('group.addFirstMember')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmitForm)}>
                    <div className="flex flex-col gap-6 py-4">
                        {/* Avatar upload section at the top (hidden when noImage is selected) */}
                        {!watchNoImage && (
                        <div className="flex flex-row gap-4 items-start">
                            {/* Avatar upload area */}
                            <div className="flex-1">
                                <Label htmlFor="avatar" className="block mb-2">
                                    {t('group.memberAvatar')}
                                </Label>
                                <Controller
                                    name="avatar"
                                    control={control}
                                    rules={{
                                        validate: (val) => {
                                            // Require avatar only if noImage is false
                                            if (!watchNoImage && !val) {
                                                return t('group.memberAvatarRequired');
                                            }
                                            return true;
                                        }
                                    }}
                                    render={({ field }) => (
                                        <>
                                            <div 
                                                className={`
                                                    border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center
                                                    w-full min-h-40 cursor-pointer hover:border-primary transition-colors
                                                    ${(errors.avatar && !watchNoImage) ? 'border-red-500' : 'border-gray-300'}
                                                `}
                                                onClick={() => document.getElementById('avatar-upload')?.click()}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                onDrop={handleFileDrop}
                                            >
                                                {avatarPreview ? (
                                                    <img 
                                                        src={avatarPreview} 
                                                        alt="Preview" 
                                                        className="max-w-full max-h-full object-contain rounded-md"
                                                    />
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <p className="text-sm text-gray-500 text-center">
                                                            {t('group.dragImageHere', 'Click or drag image here')}
                                                        </p>
                                                    </>
                                                )}
                                                <input
                                                    id="avatar-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                                <input type="hidden" {...field} />
                                            </div>
                                            {errors.avatar && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {errors.avatar.message}
                                                </p>
                                            )}
                                        </>
                                    )}
                                />
                            </div>

                            {/* Explanatory text on the right */}
                            <div className="flex-1 flex items-center h-full pt-10">
                                <p className="text-sm text-gray-500">
                                    {t('group.imageRequirements', 'Upload a photo of the person to help us choose their hair and face.')}
                                </p>
                            </div>
                        </div>
                        )}

                        {/* No image checkbox */}
                        <div className="flex items-center space-x-2">
                            <Controller
                                name="noImage"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Checkbox id="noImage" checked={!!value} onCheckedChange={(checked) => onChange(Boolean(checked))} />
                                )}
                            />
                            <Label htmlFor="noImage" className="leading-none">
                                {t('group.noImageOption', "I don't have an image of the person")}
                            </Label>
                        </div>

                        {/* Hair and face descriptions when no image */}
                        {watchNoImage && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="hairDescription" className="block mb-2">
                                        {t('group.hairDescription', 'Hair description')}
                                    </Label>
                                    <Textarea
                                        id="hairDescription"
                                        {...register('hairDescription', {
                                            validate: (val) => watchNoImage ? (!!val && val.trim().length > 0) || t('group.hairDescriptionRequired', 'Hair description is required when no image is provided') : true
                                        })}
                                        placeholder={t('group.hairDescriptionPlaceholder', 'e.g., curly brown hair, shoulder length, usually in a ponytail')}
                                        className="w-full min-h-[120px]"
                                    />
                                    {errors.hairDescription && (
                                        <p className="text-sm text-red-500">{errors.hairDescription.message as string}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="faceDescription" className="block mb-2">
                                        {t('group.faceDescription', 'Face description')}
                                    </Label>
                                    <Textarea
                                        id="faceDescription"
                                        {...register('faceDescription', {
                                            validate: (val) => watchNoImage ? (!!val && val.trim().length > 0) || t('group.faceDescriptionRequired', 'Face description is required when no image is provided') : true
                                        })}
                                        placeholder={t('group.faceDescriptionPlaceholder', 'e.g., wears glasses, has freckles, often looks serious, beard')}
                                        className="w-full min-h-[120px]"
                                    />
                                    {errors.faceDescription && (
                                        <p className="text-sm text-red-500">{errors.faceDescription.message as string}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Name field */}
                        <div>
                            <Label htmlFor="name" className="block mb-2">
                                {t('group.memberName')}
                            </Label>
                            <Input
                                id="name"
                                {...register("name", { 
                                    required: "Name is required" 
                                })}
                                placeholder={t('group.namePlaceholder')}
                                className="w-full"
                                aria-invalid={errors.name ? "true" : "false"}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Description field */}
                        <div>
                            <Label htmlFor="description" className="block mb-2">
                                {t('group.memberDescription')}
                            </Label>
                            <Textarea
                                id="description"
                                {...register("description")}
                                placeholder={t('group.memberDescriptionPlaceholder')}
                                className="w-full min-h-[150px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
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
