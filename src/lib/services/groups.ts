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

// Helper: convert a File to a base64 data URL
async function fileToDataUrl(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

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
 * Gets groups for the current user with optional pagination
 * @returns A promise that resolves to an object containing groups and pagination metadata
 */
export async function getGroups(page = 1, limit = 10): Promise<{
    groups: Group[],
    total: number,
    page: number,
    pages: number
}> {
    try {
        const response = await fetchApi<{
            groups: Group[],
            total: number,
            page: number,
            pages: number
        }>(`/groups?page=${page}&limit=${limit}`, {
            method: 'GET',
        });

        return {
            groups: response.groups || [],
            total: response.total || 0,
            page: response.page || 1,
            pages: response.pages || 1
        };
    } catch (error) {
        console.error('Get groups error:', error);
        throw error;
    }
}

/**
 * Gets a group by ID
 * @param id - The ID of the group to get
 * @param params
 * @returns A promise that resolves to the group
 */
export async function getGroupById(id: string, params?: { guestKey: string }): Promise<Group> {
    try {
        const urlParams = new URLSearchParams();
        if (params?.guestKey) urlParams.append('guest_key', params.guestKey);

        const url = `/groups/${id}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;

        const response = await fetchApi<{ group: Group }>(url, {
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
        const hasImage = Boolean(userData.avatarFile && !userData.noImage);
        let imageBase64: string | undefined;
        if (hasImage && userData.avatarFile) {
            imageBase64 = await fileToDataUrl(userData.avatarFile);
        }
        const response = await fetchApi<{ status: string; data: { referencePerson: UserResponse } }>(
            '/people',
            {
                method: 'POST',
                body: {
                    name: userData.name,
                    groupId,
                    description: userData.description,
                    noImage: typeof userData.noImage !== 'undefined' ? Boolean(userData.noImage) : undefined,
                    hasImage: hasImage,
                    hairDescription: userData.noImage ? userData.hairDescription : undefined,
                    faceDescription: userData.noImage ? userData.faceDescription : undefined,
                    additionalFields: userData.additionalFields || {},
                    imageBase64,
                },
            }
        );
        const user: UserResponse = response.data.referencePerson;
        return user;
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
        const url = `/people/${encodeURIComponent(userData.id)}?groupId=${encodeURIComponent(groupId)}`;
        const isNoImage = typeof userData.noImage !== 'undefined' ? Boolean(userData.noImage) : false;
        const hasNewAvatar = !!userData.avatar && userData.avatar.startsWith('data:');
        const response = await fetchApi<{ status: string; data: { referencePerson: UserResponse } }>(url, {
            method: 'PATCH',
            body: {
                name: userData.name,
                description: userData.description,
                // If user marks no image, inform backend and send hair/face descriptions
                noImage: hasNewAvatar ? false : (isNoImage ? true : undefined),
                hasImage: hasNewAvatar ? true : (isNoImage ? false : undefined),
                hairDescription: isNoImage ? userData.hairDescription : undefined,
                faceDescription: isNoImage ? userData.faceDescription : undefined,
                imageBase64: (!isNoImage && hasNewAvatar) ? userData.avatar : undefined,
            },
        });
        return response.data.referencePerson;
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
        await fetchApi(`/people/${encodeURIComponent(userId)}?groupId=${encodeURIComponent(groupId)}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error('Delete user error:', error);
        throw error;
    }
}

/**
 * Create a reference person GROUP entry with multiple people
 */
export async function createReferencePersonGroup(
    groupId: string,
    name: string,
    people: Array<{
        name: string;
        description?: string;
        noImage?: boolean;
        hairDescription?: string;
        faceDescription?: string;
        additionalFields?: Record<string, unknown>;
        avatarFile?: File;
    }>
): Promise<{ id: string; name: string } & Record<string, any>> {
    // Convert any files to base64 data URLs
    const enriched = await Promise.all(people.map(async (p) => {
        let imageBase64: string | undefined;
        if (!p.noImage && p.avatarFile) {
            imageBase64 = await fileToDataUrl(p.avatarFile);
        }
        return {
            name: p.name,
            description: p.description,
            noImage: p.noImage,
            hasImage: !p.noImage,
            hairDescription: p.noImage ? p.hairDescription : undefined,
            faceDescription: p.noImage ? p.faceDescription : undefined,
            additionalFields: p.additionalFields || {},
            imageBase64,
        };
    }));

    const res = await fetchApi<{ status: string; data: { referencePersonGroup: any } }>(
        '/people/groups',
        {method: 'POST', body: {groupId, name, people: enriched}}
    );
    return res.data.referencePersonGroup;
}

/**
 * Update a reference person GROUP entry
 * Accepts people payload similar to createReferencePersonGroup and appends images in order
 */
export async function updateReferencePersonGroup(
    groupId: string,
    entryId: string,
    data: { name?: string; people?: AddUserRequest[] }
): Promise<any> {
    let body: any = {groupId};
    if (typeof data.name !== 'undefined') body.name = data.name;
    if (Array.isArray(data.people)) {
        body.people = await Promise.all(data.people.map(async (p) => {
            let imageBase64: string | undefined;
            if (!p.noImage && (p as any).avatarFile) {
                imageBase64 = await fileToDataUrl((p as any).avatarFile as File);
            }
            return {
                id: (p as any).id,
                name: p.name,
                description: p.description,
                noImage: p.noImage,
                hasImage: !p.noImage,
                hairDescription: p.noImage ? p.hairDescription : undefined,
                faceDescription: p.noImage ? p.faceDescription : undefined,
                additionalFields: p.additionalFields || {},
                imageBase64,
            };
        }));
    }
    const res = await fetchApi<{ status: string; data: { referencePersonGroup: any } }>(
        `/people/groups/${encodeURIComponent(entryId)}?groupId=${encodeURIComponent(groupId)}`,
        {method: 'PATCH', body}
    );
    return res.data.referencePersonGroup;
}

/**
 * Delete a reference person GROUP entry
 */
export async function deleteReferencePersonGroup(
    groupId: string,
    entryId: string
): Promise<void> {
    await fetchApi(
        `/people/groups/${encodeURIComponent(entryId)}?groupId=${encodeURIComponent(groupId)}`,
        {method: 'DELETE'}
    );
}


// --- Matches: selected piece ---
export type MatchPart = 'wig' | 'head' | 'upperPart' | 'lowerPart';

/**
 * Set the selected matched piece for a reference person and part
 * PATCH /people/:id/matches/:part/selected-piece?groupId=...
 */
export async function setSelectedPiece(
    groupId: string,
    referencePersonId: string,
    part: MatchPart,
    pieceId: string
): Promise<void> {
    const url = `/people/${encodeURIComponent(referencePersonId)}/matches/${encodeURIComponent(part)}/selected-piece?groupId=${encodeURIComponent(groupId)}`;
    await fetchApi(url, {
        method: 'PATCH',
        body: {pieceId},
    });
}

/**
 * Enable public sharing for a member of a group
 */
export async function enableMemberShare(groupId: string, personId: string, guestKey?: string): Promise<{
    groupShareId: string,
    personShareId: string
}> {
    const url = `/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(personId)}/share/enable${guestKey ? `?guest_key=${encodeURIComponent(guestKey)}` : ''}`;
    const res = await fetchApi<{
        data: {
            referencePerson: { groupShareId: string, personShareId: string }
        }
    }>(url, {method: 'POST'});
    return res.data.referencePerson;
}

/**
 * Disable public sharing for a member of a group
 * Optionally forwards guestKey as query param when present (guest flow)
 */
export async function disableMemberShare(groupId: string, personId: string, guestKey?: string): Promise<void> {
    const url = `/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(personId)}/share/disable${guestKey ? `?guest_key=${encodeURIComponent(guestKey)}` : ''}`;
    await fetchApi(url, {method: 'POST'});
}

/**
 * Rematches a specific part for a reference person by running the AI matcher.
 * Costs 30 credits.
 * POST /people/:id/rematch/:part?groupId=...
 * @returns The updated reference person and new user balance
 */
export async function rematchPart(
    groupId: string,
    referencePersonId: string,
    part: MatchPart
): Promise<{ referencePerson: any; balance: number }> {
    const url = `/people/${encodeURIComponent(referencePersonId)}/rematch/${encodeURIComponent(part)}?groupId=${encodeURIComponent(groupId)}`;
    const response = await fetchApi<{
        status: string;
        data: {
            referencePerson: any;
            balance: number;
        };
    }>(url, {
        method: 'POST'
    });
    return response.data;
}
