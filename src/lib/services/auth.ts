import {fetchApi} from './api';

/**
 * Interface for Google login request credential
 */
interface GoogleLoginRequestCredential {
    clientId: string;
    credential: string;
    select_by: string;

    [key: string]: any; // Allow for additional properties
}

/**
 * Interface for login response from the server
 */
interface LoginResponse {
    token?: string;
    user?: {
        id: string;
        email: string;
        name?: string;
        [key: string]: any;
    };

    [key: string]: any; // Allow for additional properties
}

/**
 * Handles Google login by sending the credential to the server
 * @param googleLoginRequest - The request data from Google OAuth
 * @returns A promise that resolves to the login response from the server
 */
export async function googleLoginRequest(googleLoginRequest: GoogleLoginRequestCredential): Promise<LoginResponse> {
    try {
        return await fetchApi<LoginResponse>('/auth/google-login', {
            method: 'POST',
            body: googleLoginRequest,
        });
    } catch (error) {
        console.error('Google login error:', error);
        throw error;
    }
}

/**
 * Logs out the current user
 * @returns A promise that resolves when the logout is complete
 */
export async function logout(): Promise<void> {
    try {
        await fetchApi('/logout', {
            method: 'POST',
        });
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
}
