import type { Group } from './group';

/**
 * Interface for creating a group
 */
export interface CreateGroupRequest {
    name: string;
    description: string;
}

/**
 * Interface for the response when creating a group
 */
export interface CreateGroupResponse {
    group: Group;
    message?: string;
}
