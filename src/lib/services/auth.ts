import {fetchApi} from '.';
import {setUser} from '../stores/authStore';

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
 * @param language - The user's current language
 * @returns A promise that resolves to the login response from the server
 */
export async function googleLoginRequest(googleLoginRequest: GoogleLoginRequestCredential, language: string): Promise<LoginResponse> {
    try {
        const response = await fetchApi<LoginResponse>('/auth/google-login', {
            method: 'POST',
            body: {...googleLoginRequest, language},
        });

        // Store token in localStorage if available
        if (response.token) {
            localStorage.setItem('authToken', response.token);
        }

        // Update user state in the store
        if (response.user) {
            setUser(response.user);
        }

        return response;
    } catch (error) {
        console.error('Google login error:', error);
        throw error;
    }
}

/**
 * Handles email/password login
 * @param email - The user's email
 * @param password - The user's password
 * @param language - The user's current language
 * @returns A promise that resolves to the login response from the server
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
    try {
        const response = await fetchApi<LoginResponse>('/auth/login', {
            method: 'POST',
            body: {email, password},
            withCredentials: true,
        });

        // Store token in localStorage if available
        if (response.token) {
            localStorage.setItem('authToken', response.token);
        }

        // Update user state in the store
        if (response.user) {
            setUser(response.user);
        }

        return response;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Registers a new user with email and password
 * @param name - The user's name
 * @param email - The user's email
 * @param password - The user's password
 * @param language - The user's current language
 * @returns A promise that resolves to the login response from the server
 */
export async function register(name: string, email: string, password: string, language: string): Promise<LoginResponse> {
    try {
        const response = await fetchApi<LoginResponse>('/auth/register', {
            method: 'POST',
            body: {name, email, password, language},
            withCredentials: true,
        });

        // Store token in localStorage if available
        if (response?.token) {
            localStorage.setItem('authToken', response.token);
        }

        // Update user state in the store
        if (response?.user) {
            setUser(response.user);
        }

        return response;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

/**
 * Gets the current user profile using the stored token
 * @returns A promise that resolves to the user profile
 */
export async function getProfile(): Promise<LoginResponse> {
    try {
        const response = await fetchApi<LoginResponse>('/auth/profile', {
            method: 'GET',
        });

        // Update user state in the store
        if (response.user) {
            setUser(response.user);
        }

        return response;
    } catch (error) {
        console.error('Get profile error:', error);
        throw error;
    }
}

/**
 * Verifies a user's account with the verification code
 * @param email - The user's email
 * @param code - The verification code
 * @returns A promise that resolves to the login response from the server
 */
export async function verifyAccount(email: string, code: string): Promise<LoginResponse> {
    try {
        const response = await fetchApi<LoginResponse>('/auth/verify', {
            method: 'POST',
            body: {email, code},
            withCredentials: true,
        });

        // Store token in localStorage if available
        if (response.token) {
            localStorage.setItem('authToken', response.token);
        }

        // Update user state in the store
        if (response.user) {
            setUser(response.user);
        }

        return response;
    } catch (error) {
        console.error('Account verification error:', error);
        throw error;
    }
}

/**
 * Requests a password reset link for given email
 * @param email - The user's email
 * @param language - Current language for localized email copy
 */
export async function requestPasswordReset(
    email: string,
    language: string
): Promise<{ message: string; messageKey?: string }> {
    try {
        const response = await fetchApi<{ message: string; messageKey?: string }>(
            '/auth/password/forgot',
            {
                method: 'POST',
                body: { email, language },
            }
        );
        return response;
    } catch (error) {
        console.error('Password reset request error:', error);
        throw error;
    }
}

/**
 * Resets the password using email + code + new password
 * @param email - The user's email
 * @param code - The reset code received by email
 * @param newPassword - The new password to set
 */
export async function resetPassword(
    email: string,
    code: string,
    newPassword: string
): Promise<{ message: string; messageKey?: string }> {
    try {
        const response = await fetchApi<{ message: string; messageKey?: string }>(
            '/auth/password/reset',
            {
                method: 'POST',
                body: { email, code, newPassword },
            }
        );
        return response;
    } catch (error) {
        console.error('Password reset error:', error);
        throw error;
    }
}
