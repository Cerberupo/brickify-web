import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button, Checkbox, Input, Label, Textarea, Toaster} from '@/components/ui';
import {toast} from 'sonner';
import type {AddUserRequest, UpdateUserRequest} from '@/lib/types';

export type InlineMemberEditorMode = 'add' | 'edit';

interface InlineMemberEditorProps {
    mode: InlineMemberEditorMode;
    initial?: {
        id?: string;
        name?: string;
        description?: string;
        imageSignedUrl?: string;
        imagePath?: string;
        avatar?: string;
        hasImage?: boolean;
        hairDescription?: string;
        faceDescription?: string;
    };
    onCancel: () => void;
    onSaveAdd?: (data: AddUserRequest) => Promise<void>;
    onSaveEdit?: (data: UpdateUserRequest) => Promise<void>;
    /**
     * When provided in add mode, the editor will emit the current payload and validity on every change.
     */
    onChangeAdd?: (data: AddUserRequest | null, valid: boolean) => void;
    /**
     * Controls whether the editor renders its own action buttons. Defaults to true.
     */
    showActions?: boolean;
}

export const InlineMemberEditor: React.FC<InlineMemberEditorProps> = ({
                                                                          mode,
                                                                          initial,
                                                                          onCancel,
                                                                          onSaveAdd,
                                                                          onSaveEdit,
                                                                          onChangeAdd,
                                                                          showActions = true,
                                                                      }) => {
    const {t} = useTranslation();

    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [saving, setSaving] = useState(false);

    // Image handling (add mode uses File, edit mode can keep existing image and optionally change)
    const [noImage, setNoImage] = useState<boolean>(() => {
        // If initial explicitly has no image OR there is no image source in initial, default to noImage in edit mode
        if (mode === 'edit') {
            const hasImgFlag = initial?.hasImage;
            const hasSrc = Boolean(initial?.imageSignedUrl || initial?.imagePath || initial?.avatar);
            if (hasImgFlag === false || !hasSrc) return true;
        }
        return false;
    });
    const [hairDescription, setHairDescription] = useState(initial?.hairDescription ?? '');
    const [faceDescription, setFaceDescription] = useState(initial?.faceDescription ?? '');

    const [avatarPreview, setAvatarPreview] = useState<string | null>(initial?.imageSignedUrl || initial?.imagePath || initial?.avatar || null);
    const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);

    const MAX_BASE64_BYTES = 2 * 1024 * 1024; // 2MB

    // Helper: quick estimate whether base64 will exceed 2MB given file size
    const exceedsBase64Limit = (file: File): boolean => {
        const estimated = Math.ceil((file.size * 4) / 3);
        return estimated > MAX_BASE64_BYTES;
    };

    // Per-instance input ids and refs to avoid collisions when rendering multiple editors
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputId = useId();
    const noImageId = useId();

    useEffect(() => {
        // If user checks noImage, clear file preview
        if (noImage) {
            setAvatarFile(undefined);
            setAvatarPreview(null);
        }
    }, [noImage]);

    // Re-sync internal state when initial changes (especially in edit mode)
    useEffect(() => {
        if (!initial) return;
        setName(initial.name ?? '');
        setDescription(initial.description ?? '');
        const hasSrc = Boolean(initial.imageSignedUrl || initial.imagePath || initial.avatar);
        const derivedNoImage = initial.hasImage === false || !hasSrc;
        setNoImage(derivedNoImage);
        setHairDescription(initial.hairDescription ?? '');
        setFaceDescription(initial.faceDescription ?? '');
        setAvatarPreview(hasSrc ? (initial.imageSignedUrl || initial.imagePath || initial.avatar || null) : null);
        setAvatarFile(undefined);
    }, [initial, mode]);

    const canSubmit = useMemo(() => {
        if (!name.trim()) return false;
        if (noImage) {
            return hairDescription.trim().length > 0 && faceDescription.trim().length > 0;
        }
        // When image is required (add mode): if there is no existing image preview and no file, disallow
        if (mode === 'add') {
            // allow existing preview (coming from initial data) OR a new file
            return !!avatarFile || !!avatarPreview; // require some image when not in noImage mode
        }
        // edit mode: image change is optional
        return true;
    }, [name, noImage, hairDescription, faceDescription, avatarFile, mode]);

    // Emit current add payload & validity when used inside a composite editor
    useEffect(() => {
        if (mode !== 'add') return;
        if (!onChangeAdd) return;
        const valid = canSubmit;
        const payload: AddUserRequest = {
            name: name.trim(),
            description: description?.trim() || undefined,
            avatarFile: noImage ? undefined : avatarFile,
            noImage: noImage || undefined,
            hairDescription: noImage ? hairDescription.trim() : undefined,
            faceDescription: noImage ? faceDescription.trim() : undefined,
        };
        // If not valid, we still pass the partial to help parent keep state; parent can ignore when !valid
        onChangeAdd(valid ? payload : payload, valid);
    }, [mode, onChangeAdd, canSubmit, name, description, noImage, hairDescription, faceDescription, avatarFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (exceedsBase64Limit(file)) {
                toast.error(t('group.imageTooLarge', 'The selected image is too large. Maximum allowed is 2MB.'));
                // reset input value to allow selecting same file again later
                if (e.target) e.target.value = '';
                return;
            }
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
            setAvatarFile(file);
        }
    };

    const onSubmit = async () => {
        if (!canSubmit || saving) return;
        setSaving(true);
        try {
            if (mode === 'add' && onSaveAdd) {
                const payload: AddUserRequest = {
                    name: name.trim(),
                    description: description?.trim() || undefined,
                    avatarFile: noImage ? undefined : avatarFile,
                    noImage: noImage || undefined,
                    hairDescription: noImage ? hairDescription.trim() : undefined,
                    faceDescription: noImage ? faceDescription.trim() : undefined,
                };
                await onSaveAdd(payload);
                return;
            }

            if (mode === 'edit' && onSaveEdit && initial?.id) {
                const payload: UpdateUserRequest = {
                    id: initial.id,
                    name: name.trim(),
                    description: description?.trim() || undefined,
                    noImage: noImage || undefined,
                    hairDescription: noImage ? hairDescription.trim() : undefined,
                    faceDescription: noImage ? faceDescription.trim() : undefined,
                } as UpdateUserRequest;

                // Only attach avatar when not in no-image mode
                if (!noImage) {
                    if (avatarFile) {
                        // read as base64 data URL
                        const dataUrl = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = () => reject(new Error('Failed to read image'));
                            reader.readAsDataURL(avatarFile);
                        });
                        // Strict check on actual decoded base64 size (2MB)
                        const commaIdx = dataUrl.indexOf(',');
                        const base64 = commaIdx >= 0 ? dataUrl.substring(commaIdx + 1) : dataUrl;
                        const padding = (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
                        const decodedBytes = Math.floor((base64.length * 3) / 4) - padding;
                        if (decodedBytes > MAX_BASE64_BYTES) {
                            toast.error(t('group.imageTooLarge', 'The selected image is too large. Maximum allowed is 2MB.'));
                            return; // abort submit
                        }
                        payload.avatar = dataUrl;
                    } else if (initial?.imageSignedUrl || initial?.imagePath || initial?.avatar) {
                        payload.avatar = initial.imageSignedUrl || initial.imagePath || initial.avatar || undefined;
                    }
                }

                await onSaveEdit(payload);
                return;
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-md p-3 md:p-4 bg-transparent border">
            <Toaster position="top-right"/>
            <div className="flex flex-col gap-4">
                {/* Header: Title + No-image toggle inline to save space */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold m-0">
                        {mode === 'add' ? t('group.addMember') : t('group.editMember')}
                    </h3>
                    <div className="flex items-center gap-2">
                        <Checkbox id={noImageId} checked={noImage} onCheckedChange={(c) => setNoImage(Boolean(c))}/>
                        <Label htmlFor={noImageId} className="text-sm">{t('group.noImageOption')}</Label>
                    </div>
                </div>

                {/* Main layout: compact two-column on md+ screens */}
                {!noImage ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Left: Image dropzone */}
                        <div className="md:col-span-3">
                            <Label htmlFor={`avatar-upload-${avatarInputId}`}
                                   className="block mb-2">{t('group.memberAvatar')}</Label>
                            <div
                                className={`border-2 border-dashed rounded-md p-3 flex flex-col items-center justify-center w-full min-h-32 cursor-pointer hover:border-primary transition-colors aspect-square`}
                                onClick={() => fileInputRef.current?.click()}
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
                                            if (exceedsBase64Limit(file)) {
                                                toast.error(t('group.imageTooLarge', 'The selected image is too large. Maximum allowed is 2MB.'));
                                                return;
                                            }
                                            const previewUrl = URL.createObjectURL(file);
                                            setAvatarPreview(previewUrl);
                                            setAvatarFile(file);
                                        }
                                    }
                                }}
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Preview"
                                         className="w-full h-40 object-cover rounded-md border border-gray-200"/>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2"
                                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                        </svg>
                                        <p className="text-xs text-gray-500 text-center">{t('group.dragImageHere')}</p>
                                    </>
                                )}
                                <input id={`avatar-upload-${avatarInputId}`} ref={fileInputRef} type="file"
                                       accept="image/*" onChange={handleFileChange}
                                       className="hidden"/>
                            </div>
                        </div>

                        {/* Right: Name + Description stacked compactly */}
                        <div
                            className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4 items-start self-start content-start">
                            <div className="md:col-span-2">
                                <Label htmlFor="name" className="block mb-1">{t('group.memberName')}</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
                                       placeholder={t('group.namePlaceholder')}/>
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="desc" className="block mb-1">{t('group.memberDescription')}</Label>
                                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)}
                                          placeholder={t('group.memberDescriptionPlaceholder')}
                                          className="min-h-[96px]"/>
                            </div>
                        </div>
                    </div>
                ) : (
                    // No image mode: put name/description on the left and hair/face on the right
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-5 grid grid-cols-1 gap-4">
                            <div>
                                <Label htmlFor="name" className="block mb-1">{t('group.memberName')}</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
                                       placeholder={t('group.namePlaceholder')}/>
                            </div>
                            <div>
                                <Label htmlFor="desc" className="block mb-1">{t('group.memberDescription')}</Label>
                                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)}
                                          placeholder={t('group.memberDescriptionPlaceholder')}
                                          className="min-h-[96px]"/>
                            </div>
                        </div>
                        <div className="md:col-span-7 grid grid-cols-1 gap-4">
                            <div>
                                <Label htmlFor="hairDescription"
                                       className="block mb-1">{t('group.hairDescription')}</Label>
                                <Textarea id="hairDescription" value={hairDescription}
                                          onChange={(e) => setHairDescription(e.target.value)}
                                          placeholder={t('group.hairDescriptionPlaceholder')} className="min-h-[96px]"/>
                            </div>
                            <div>
                                <Label htmlFor="faceDescription"
                                       className="block mb-1">{t('group.faceDescription')}</Label>
                                <Textarea id="faceDescription" value={faceDescription}
                                          onChange={(e) => setFaceDescription(e.target.value)}
                                          placeholder={t('group.faceDescriptionPlaceholder')} className="min-h-[96px]"/>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {showActions && (
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={onCancel} disabled={saving}>{t('group.cancel')}</Button>
                        <Button onClick={onSubmit} disabled={!canSubmit || saving}
                                isLoading={saving}>{t('group.save')}</Button>
                    </div>
                )}
            </div>
        </div>
    );
};
