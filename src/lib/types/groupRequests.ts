import type {Group} from './group';

/**
 * Interface for creating a group
 */
export interface CreateGroupRequest {
    name: string;
    description: string;
    groupType: string;
}

/**
 * Interface for the response when creating a group
 */
export interface CreateGroupResponse {
    group: Group;
    message?: string;
}

/**
 * Interface for updating a group (only name and description)
 */
export interface UpdateGroupRequest {
    name?: string;
    description?: string;
}

export interface UpdateGroupResponse {
    group: Group;
    message?: string;
}

/**
 * Interface for adding a user to a group
 */
export interface AddUserRequest {
    name: string;
    email?: string;
    avatar?: string;  // Image (optional if noImage is true)
    noImage?: boolean; // User indicates no image available
    hairDescription?: string; // Required if noImage is true
    faceDescription?: string; // Required if noImage is true
    description?: string;  // Additional information about the person (optional)
}

/**
 * Interface for updating a user in a group
 */
export interface UpdateUserRequest {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    description?: string;  // Additional information about the person
}

/**
 * Interface for the response when adding or updating a user
 */
export interface UserResponse {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    description?: string;  // Additional information about the person
    message?: string;
}
