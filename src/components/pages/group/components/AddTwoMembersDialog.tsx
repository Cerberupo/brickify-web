import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Controller, useForm} from 'react-hook-form';
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
import type {AddUserRequest} from '@/lib/types';

// Form types for two people
interface PersonFormValues {
    name: string;
    description?: string;
    noImage: boolean;
    hairDescription?: string;
    faceDescription?: string;
}

interface AddTwoMembersFormValues {
    person1: PersonFormValues;
    person2: PersonFormValues;
}

interface AddTwoMembersDialogProps {
    onAdd: (userData: AddUserRequest) => Promise<void>;
    trigger?: React.ReactNode;
}

export function AddTwoMembersDialog({onAdd, trigger}: AddTwoMembersDialogProps) {
    const {t} = useTranslation();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        formState: {errors}
    } = useForm<AddTwoMembersFormValues>({
        defaultValues: {
            person1: { name: '', description: '', noImage: false, hairDescription: '', faceDescription: '' },
            person2: { name: '', description: '', noImage: false, hairDescription: '', faceDescription: '' },
        }
    });

    const watchNoImage1 = watch('person1.noImage');
    const watchNoImage2 = watch('person2.noImage');

    const onSubmitForm = async (data: AddTwoMembersFormValues) => {
        setIsLoading(true);
        try {
            // First person
            await onAdd({
                name: data.person1.name.trim(),
                noImage: data.person1.noImage || undefined,
                hairDescription: data.person1.noImage ? data.person1.hairDescription?.trim() : undefined,
                faceDescription: data.person1.noImage ? data.person1.faceDescription?.trim() : undefined,
                description: data.person1.description?.trim()
            });
            // Second person
            await onAdd({
                name: data.person2.name.trim(),
                noImage: data.person2.noImage || undefined,
                hairDescription: data.person2.noImage ? data.person2.hairDescription?.trim() : undefined,
                faceDescription: data.person2.noImage ? data.person2.faceDescription?.trim() : undefined,
                description: data.person2.description?.trim()
            });

            reset();
            setOpen(false);
        } catch (e) {
            // Parent handles toasts; keep dialog open for correction
            console.error('Error adding two members:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const Section = ({index, noImageChecked}: { index: 1 | 2; noImageChecked: boolean }) => (
        <div className="border rounded-md p-4 space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">
                {index === 1 ? t('group.firstPerson', 'Persona 1') : t('group.secondPerson', 'Persona 2')}
            </h4>

            {/* No image option */}
            <div className="flex items-center space-x-2">
                <Controller
                    name={`person${index}.noImage` as const}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <Checkbox id={`p${index}-noImage`} checked={!!value} onCheckedChange={(checked) => onChange(Boolean(checked))} />
                    )}
                />
                <Label htmlFor={`p${index}-noImage`} className="leading-none">
                    {t('group.noImageOption', "No tengo imagen de la persona")}
                </Label>
            </div>

            {/* Name */}
            <div>
                <Label htmlFor={`p${index}-name`} className="block mb-2">
                    {t('group.memberName')}
                </Label>
                <Input
                    id={`p${index}-name`}
                    {...register(`person${index}.name` as const, { required: t('form.name.required', 'El nombre es obligatorio') as string })}
                    placeholder={t('group.namePlaceholder')}
                    aria-invalid={errors[`person${index}` as 'person1' | 'person2']?.name ? 'true' : 'false'}
                />
                {errors[`person${index}` as 'person1' | 'person2']?.name && (
                    <p className="text-sm text-red-500">
                        {errors[`person${index}` as 'person1' | 'person2']?.name?.message as string}
                    </p>
                )}
            </div>

            {/* Two-column layout when no image: left Name/Desc, right Hair/Face */}
            {noImageChecked && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Left: Name + Person description */}
                    <div className="md:col-span-6">
                        <div className="mb-4">
                            <Label htmlFor={`p${index}-name`} className="block mb-2">
                                {t('group.memberName')}
                            </Label>
                            <Input
                                id={`p${index}-name`}
                                {...register(`person${index}.name` as const, { required: t('form.name.required', 'El nombre es obligatorio') as string })}
                                placeholder={t('group.namePlaceholder')}
                                aria-invalid={errors[`person${index}` as 'person1' | 'person2']?.name ? 'true' : 'false'}
                            />
                            {errors[`person${index}` as 'person1' | 'person2']?.name && (
                                <p className="text-sm text-red-500">
                                    {errors[`person${index}` as 'person1' | 'person2']?.name?.message as string}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor={`p${index}-desc`} className="block mb-2">
                                {t('group.memberDescription')}
                            </Label>
                            <Textarea
                                id={`p${index}-desc`}
                                {...register(`person${index}.description` as const)}
                                placeholder={t('group.memberDescriptionPlaceholder')}
                                className="w-full min-h-[120px]"
                            />
                        </div>
                    </div>

                    {/* Right: Hair + Face */}
                    <div className="md:col-span-6">
                        <div className="mb-4">
                            <Label htmlFor={`p${index}-hair`} className="block mb-2">
                                {t('group.hairDescription')}
                            </Label>
                            <Textarea
                                id={`p${index}-hair`}
                                {...register(`person${index}.hairDescription` as const)}
                                placeholder={t('group.hairDescriptionPlaceholder')}
                                className="w-full min-h-[120px]"
                            />
                        </div>
                        <div>
                            <Label htmlFor={`p${index}-face`} className="block mb-2">
                                {t('group.faceDescription')}
                            </Label>
                            <Textarea
                                id={`p${index}-face`}
                                {...register(`person${index}.faceDescription` as const)}
                                placeholder={t('group.faceDescriptionPlaceholder')}
                                className="w-full min-h-[120px]"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Extra notes/description only when image is provided */}
            {!noImageChecked && (
                <div>
                    <Label htmlFor={`p${index}-desc`} className="block mb-2">
                        {t('group.memberDescription')}
                    </Label>
                    <Textarea
                        id={`p${index}-desc`}
                        {...register(`person${index}.description` as const)}
                        placeholder={t('group.memberDescriptionPlaceholder')}
                        className="w-full min-h-[120px]"
                    />
                </div>
            )}
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (!newOpen) {
                reset();
            }
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline">
                        {t('group.addTwoMembers', 'Añadir 2 personas')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('group.addTwoMembersTitle', 'Añadir dos personas')}</DialogTitle>
                    <DialogDescription>
                        {t('group.addTwoMembersDescription', 'Agrega dos personas a la vez (por ejemplo, hermanos, amigos, etc.).')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmitForm)}>
                    <div className="flex flex-col gap-6 py-4">
                        <Section index={1} noImageChecked={!!watchNoImage1} />
                        <Section index={2} noImageChecked={!!watchNoImage2} />
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
