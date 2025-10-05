import type {Group} from '@/lib/types/group';
import type {GroupType} from "@/constants/group.ts";

/**
 * Props for the GroupCard component
 */
export interface GroupCardProps {
    group: Group;
    onEdit?: (group: Group) => void;
}

/**
 * Props for the CreateGroupModal component
 */
export interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Create flow
    onSubmit: (name: string, description: string, groupType: string) => void;
    // Edit flow (only name and description)
    mode?: 'create' | 'edit';
    initialValues?: { id?: string; name: string; description: string, groupType: GroupType };
    onSubmitEdit?: (id: string, name: string, description: string) => void;
}
