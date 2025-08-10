import {fetchApi} from './api';
import type {
    AddUserRequest,
    CreateGroupRequest,
    CreateGroupResponse,
    Group,
    UpdateGroupRequest,
    UpdateGroupResponse,
    UpdateUserRequest,
    UserResponse
} from '@/lib/types';

/**
 * Creates a new group
 * @param data - The group data (name and description)
 * @returns A promise that resolves to the created group
 */
export async function createGroup(data: CreateGroupRequest): Promise<CreateGroupResponse> {
    try {
        const response = await fetchApi<CreateGroupResponse>('/groups', {
            method: 'POST',
            body: data,
        });

        return response;
    } catch (error) {
        console.error('Create group error:', error);
        throw error;
    }
}

/**
 * Gets all groups for the current user
 * @returns A promise that resolves to an array of groups
 */
export async function getGroups(): Promise<Group[]> {
    try {
        const response = await fetchApi<{ groups: Group[] }>('/groups', {
            method: 'GET',
        });

        return response.groups || [];
    } catch (error) {
        console.error('Get groups error:', error);
        throw error;
    }
}

/**
 * Gets a group by ID
 * @param id - The ID of the group to get
 * @returns A promise that resolves to the group
 */
export async function getGroupById(id: string): Promise<Group> {
    try {
        const response = await fetchApi<{ group: Group }>(`/groups/${id}`, {
            method: 'GET',
        });

        return response.group;
    } catch (error) {
        console.error('Get group error:', error);
        throw error;
    }
}

/**
 * Deletes a group by ID
 * @param id - The ID of the group to delete
 * @returns A promise that resolves when the group is deleted
 */
export async function deleteGroup(id: string): Promise<void> {
    try {
        await fetchApi(`/groups/${id}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error('Delete group error:', error);
        throw error;
    }
}

/**
 * Updates a group by ID (name and/or description)
 */
export async function updateGroup(id: string, data: UpdateGroupRequest): Promise<UpdateGroupResponse> {
    try {
        const response = await fetchApi<UpdateGroupResponse>(`/groups/${id}`, {
            method: 'PATCH',
            body: data,
        });
        return response;
    } catch (error) {
        console.error('Update group error:', error);
        throw error;
    }
}

/**
 * Adds a user to a group
 * @param groupId - The ID of the group to add the user to
 * @param userData - The user data (name, email, avatar)
 * @returns A promise that resolves to the added user
 */
export async function addUserToGroup(groupId: string, userData: AddUserRequest): Promise<UserResponse> {
    try {
        const response = await fetchApi<{ user: UserResponse }>(`/groups/${groupId}/users`, {
            method: 'POST',
            body: userData,
        });

        return response.user;
    } catch (error) {
        console.error('Add user error:', error);
        throw error;
    }
}

/**
 * Updates a user in a group
 * @param groupId - The ID of the group the user belongs to
 * @param userData - The user data to update (id, name, email, avatar)
 * @returns A promise that resolves to the updated user
 */
export async function updateUserInGroup(groupId: string, userData: UpdateUserRequest): Promise<UserResponse> {
    try {
        const response = await fetchApi<{ user: UserResponse }>(`/groups/${groupId}/users/${userData.id}`, {
            method: 'PUT',
            body: userData,
        });

        return response.user;
    } catch (error) {
        console.error('Update user error:', error);
        throw error;
    }
}

/**
 * Deletes a user from a group
 * @param groupId - The ID of the group the user belongs to
 * @param userId - The ID of the user to delete
 * @returns A promise that resolves when the user is deleted
 */
export async function deleteUserFromGroup(groupId: string, userId: string): Promise<void> {
    try {
        await fetchApi(`/groups/${groupId}/users/${userId}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error('Delete user error:', error);
        throw error;
    }
}
