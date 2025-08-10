import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui";
import { Pencil, Trash2 } from 'lucide-react';

interface MemberListProps {
    members: {
        id: string;
        name: string;
        avatar?: string;
        description?: string;
    }[];
    onEdit: (memberId: string) => void;
    onDelete: (memberId: string) => void;
}

export function MemberList({ members, onEdit, onDelete }: MemberListProps) {
    const { t } = useTranslation();

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
                                <Avatar className="h-8 w-8">
                                    {member.avatar ? (
                                        <AvatarImage src={member.avatar} alt={member.name} />
                                    ) : (
                                        <AvatarFallback>
                                            {member.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell className="text-sm text-gray-600">
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
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">{t('group.editMember')}</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => onDelete(member.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
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
