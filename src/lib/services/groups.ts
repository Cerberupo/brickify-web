import {fetchApi} from './api';
import type {Group} from '@/lib/types/group';
import type {CreateGroupRequest, CreateGroupResponse} from '@/lib/types/groupRequests';

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
