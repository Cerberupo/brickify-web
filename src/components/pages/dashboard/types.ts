import type { Group } from '@/lib/types/group';

/**
 * Props for the GroupCard component
 */
export interface GroupCardProps {
    group: Group;
}

/**
 * Props for the CreateGroupModal component
 */
export interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, description: string) => void;
}
