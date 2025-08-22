import React, {useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button, Input, Label} from '@/components/ui';
import type {AddUserRequest} from '@/lib/types';
import {InlineMemberEditor} from './InlineMemberEditor';

interface InlineTwoMembersEditorProps {
    onCancel: () => void;
    onAdd?: (data: AddUserRequest) => Promise<void>;
    onAddGroup?: (data: { subgroupName: string; people: AddUserRequest[] }) => Promise<void>;
    // Edit mode support
    mode?: 'add' | 'edit';
    initialGroup?: { entryId: string; name: string; people: Array<{ id?: string; name: string; description?: string; imageSignedUrl?: string; imagePath?: string; avatar?: string; noImage?: boolean; hairDescription?: string; faceDescription?: string; }> };
    onUpdateGroup?: (data: { entryId: string; subgroupName: string; people: AddUserRequest[] }) => Promise<void>;
}

export const InlineTwoMembersEditor: React.FC<InlineTwoMembersEditorProps> = ({onCancel, onAdd, onAddGroup, mode = 'add', initialGroup, onUpdateGroup}) => {
    const {t} = useTranslation();
    const [subgroupName, setSubgroupName] = useState(initialGroup?.name || '');

    // Child refs/state trackers
    const [saving, setSaving] = useState(false);

    const [person1, setPerson1] = useState<AddUserRequest | null>(null);
    const [person2, setPerson2] = useState<AddUserRequest | null>(null);
    const [valid1, setValid1] = useState(false);
    const [valid2, setValid2] = useState(false);

    const canSave = useMemo(() => {
        return subgroupName.trim().length > 0 && !!person1 && !!person2 && valid1 && valid2;
    }, [subgroupName, person1, person2, valid1, valid2]);

    // Shallow comparison to avoid unnecessary state changes (which can cause update loops)
    const sameAddUser = (a: AddUserRequest | null, b: AddUserRequest | null) => {
        if (a === b) return true;
        if (!a || !b) return false;
        const aFile = a.avatarFile as File | undefined;
        const bFile = b.avatarFile as File | undefined;
        const fileSame = (!aFile && !bFile) || (
            !!aFile && !!bFile && aFile.name === bFile.name && aFile.size === bFile.size && aFile.lastModified === bFile.lastModified
        );
        return (
            a.name === b.name &&
            a.description === b.description &&
            a.noImage === b.noImage &&
            a.hairDescription === b.hairDescription &&
            a.faceDescription === b.faceDescription &&
            fileSame
        );
    };

    const handleChange1 = React.useCallback((data: AddUserRequest | null, valid: boolean) => {
        if (!sameAddUser(person1, data)) setPerson1(data);
        if (valid1 !== valid) setValid1(valid);
    }, [person1, valid1]);

    const handleChange2 = React.useCallback((data: AddUserRequest | null, valid: boolean) => {
        if (!sameAddUser(person2, data)) setPerson2(data);
        if (valid2 !== valid) setValid2(valid);
    }, [person2, valid2]);

    const handleSaveAll = async () => {
        if (!canSave || !person1 || !person2) return;
        setSaving(true);
        try {
            if (mode === 'edit' && initialGroup && onUpdateGroup) {
                await onUpdateGroup({
                    entryId: initialGroup.entryId,
                    subgroupName,
                    people: [
                        { ...(person1 as any), id: initialGroup.people?.[0]?.id, additionalFields: { ...(person1.additionalFields || {}), subgroupName } },
                        { ...(person2 as any), id: initialGroup.people?.[1]?.id, additionalFields: { ...(person2.additionalFields || {}), subgroupName } },
                    ],
                });
            } else if (onAddGroup) {
                await onAddGroup({
                    subgroupName,
                    people: [
                        { ...person1, additionalFields: { ...(person1.additionalFields || {}), subgroupName } },
                        { ...person2, additionalFields: { ...(person2.additionalFields || {}), subgroupName } },
                    ],
                });
            } else if (onAdd) {
                await onAdd({ ...person1, additionalFields: { ...(person1.additionalFields || {}), subgroupName } });
                await onAdd({ ...person2, additionalFields: { ...(person2.additionalFields || {}), subgroupName } });
            }
            onCancel();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-md p-3 md:p-4 bg-transparent border-l-4 border-primary/20">
            <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold">{t('group.addTwoMembersTitle')}</h3>

                <div>
                    <Label htmlFor="subgroup-name"
                           className="block mb-2">{t('group.subgroupName', 'Nombre del subgrupo')}</Label>
                    <Input id="subgroup-name" value={subgroupName} onChange={(e) => setSubgroupName(e.target.value)}
                           placeholder={t('group.subgroupName', 'Nombre del subgrupo')}/>
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <InlineMemberEditor
                            mode="add"
                            showActions={false}
                            initial={initialGroup?.people?.[0]}
                            onCancel={() => { /* hidden actions */
                            }}
                            onChangeAdd={handleChange1}
                        />
                    </div>
                    <div>
                        <InlineMemberEditor
                            mode="add"
                            showActions={false}
                            initial={initialGroup?.people?.[1]}
                            onCancel={() => { /* hidden actions */
                            }}
                            onChangeAdd={handleChange2}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onCancel}>{t('group.cancel')}</Button>
                    <Button onClick={handleSaveAll} disabled={!canSave || saving}>{t('group.save')}</Button>
                </div>
            </div>
        </div>
    );
};
