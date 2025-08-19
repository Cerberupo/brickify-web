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
    // File selected by the user (sent as multipart field 'image')
    avatarFile?: File;
    // Flags and descriptions when no image is provided
    noImage?: boolean;
    hairDescription?: string;
    faceDescription?: string;
    // Additional information about the person (optional)
    description?: string;
    // Future-proof: extra fields to send alongside if needed
    additionalFields?: Record<string, unknown>;
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
    // When no image is provided in edit mode
    noImage?: boolean;
    hairDescription?: string;
    faceDescription?: string;
}

/**
 * Interface for the response when adding or updating a user
 */
export interface UserResponse {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    imageSignedUrl?: string;
    imagePath?: string;
    description?: string;  // Additional information about the person
    hasImage?: boolean;
    hairDescription?: string;
    faceDescription?: string;
    message?: string;
}
