import React from 'react';
import {useTranslation} from 'react-i18next';
import {
    Avatar,
    AvatarImage,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui";
import {Pencil, Trash2} from 'lucide-react';
import favicon from '@/images/favicon.png';

const faviconUrl: string = typeof favicon === 'string' ? favicon : (favicon as any).src;

interface MemberListProps {
    readOnly?: boolean;
    members: {
        id: string;
        name: string;
        avatar?: string;
        imageSignedUrl?: string;
        imagePath?: string;
        description?: string;
    }[];
    onEdit: (memberId: string) => void;
    onDelete: (memberId: string) => void;
}

export function MemberList({readOnly = false, members, onEdit, onDelete}: MemberListProps) {
    const {t} = useTranslation();

    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>{t('group.memberName')}</TableHead>
                        <TableHead>{t('group.memberDescription')}</TableHead>
                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map((member) => (
                        <TableRow key={member.id}>
                            <TableCell>
                                <Avatar className="h-8 w-8 ring-1 ring-gray-200">
                                    <AvatarImage className="object-cover"
                                                 src={member.imageSignedUrl || member.imagePath || member.avatar || faviconUrl}
                                                 alt={member.name}/>
                                </Avatar>
                            </TableCell>
                            <TableCell className="font-medium align-top">{member.name}</TableCell>
                            <TableCell className="text-sm text-gray-600 align-top">
                                {member.description ? (
                                    <div className="max-h-20 overflow-y-auto">
                                        {member.description}
                                    </div>
                                ) : (
                                    <span className="text-gray-400 italic">
                                        {t('group.noDescription', 'No description provided')}
                                    </span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onEdit(member.id)}
                                    >
                                        <Pencil className="h-4 w-4"/>
                                        <span className="sr-only">{t('group.editMember')}</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => onDelete(member.id)}
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                        <span className="sr-only">{t('group.deleteMember')}</span>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
