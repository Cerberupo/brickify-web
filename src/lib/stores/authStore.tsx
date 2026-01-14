import {getProfile as fetchProfile} from '../services/auth';
import i18n from 'i18next';
import React from 'react';
import {atom} from 'nanostores';
import {useStore} from '@nanostores/react';

// Define the User type
export interface User {
    id: string;
    email: string;
    name?: string;
    language?: string;

    [key: string]: any;
}

// Helper functions to work with sessionStorage
const USER_STORAGE_KEY = 'brickify_user';

function getUserFromStorage(): User | null {
    if (typeof window === 'undefined') return null;

    const userJson = sessionStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) return null;

    try {
        return JSON.parse(userJson);
    } catch (error) {
        console.error('Failed to parse user from sessionStorage:', error);
        return null;
    }
}

function setUserInStorage(user: User | null): void {
    if (typeof window === 'undefined') return;

    if (user) {
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
        sessionStorage.removeItem(USER_STORAGE_KEY);
    }
}

// Create atoms for auth state
export const userAtom = atom<User | null>(getUserFromStorage());
export const isLoadingAtom = atom<boolean>(true);

// Initialize auth state by checking for token and fetching user profile
export async function initAuth(): Promise<User | null> {
    try {
        isLoadingAtom.set(true);

        const token = localStorage.getItem('authToken');
        if (!token) {
            userAtom.set(null);
            isLoadingAtom.set(false);
            return null;
        }

        // Check if user data is already in sessionStorage
        const storedUser = getUserFromStorage();
        if (storedUser) {
            // Use the stored user data as initial state
            userAtom.set(storedUser);

            // Change language if user has a language preference
            if (storedUser.language && i18n.languages.includes(storedUser.language)) {
                i18n.changeLanguage(storedUser.language);
            }
        }

        // Always fetch from API to ensure we have the latest data (e.g. balance)
        const response = await fetchProfile();
        const user = response.user || null;

        if (user) {
            // Update both the atom and sessionStorage
            userAtom.set(user);
            setUserInStorage(user);

            // Change language if user has a language preference
            if (user.language && i18n.languages.includes(user.language)) {
                i18n.changeLanguage(user.language);
            }
        } else {
            userAtom.set(null);
        }

        isLoadingAtom.set(false);
        return user;
    } catch (error) {
        console.error('Failed to get user profile:', error);
        // If there's an error, clear the token and user
        localStorage.removeItem('authToken');
        sessionStorage.removeItem(USER_STORAGE_KEY);
        userAtom.set(null);
        isLoadingAtom.set(false);
        return null;
    }
}

// Set user (used after login/registration)
export function setUser(user: User | null) {
    // Update both the atom and sessionStorage
    userAtom.set(user);
    setUserInStorage(user);

    // Change language if user has a language preference
    if (user && user.language && i18n.languages.includes(user.language)) {
        i18n.changeLanguage(user.language);
    }
}

// Clear user (used for logout)
export function clearUser() {
    // Clear both the atom and storage
    userAtom.set(null);
    setUserInStorage(null);
    localStorage.removeItem('authToken');
}

// Global flag to track if auth has been initialized
let globalInitialized = false;

// Auth Provider component
export function AuthProvider({children}: { children: React.ReactNode }) {
    const [initialized, setInitialized] = React.useState(false);

    React.useEffect(() => {
        if (typeof window !== 'undefined' && !initialized) {
            // Check if auth has already been initialized globally
            if (globalInitialized) {
                // If already initialized, just update local state
                setInitialized(true);
            } else {
                // Initialize auth state only if not already initialized
                initAuth().finally(() => {
                    globalInitialized = true;
                    setInitialized(true);
                });
            }
        } else {
            setInitialized(true);
        }
    }, [initialized]);

    // Don't render children until auth is initialized
    if (!initialized) {
        return null;
    }

    return <>{children}</>;
}

// Hook to use auth context with nanostores
export function useAuthContext() {
    // Use the useStore hook to make the values reactive
    const user = useStore(userAtom);
    const isLoading = useStore(isLoadingAtom);

    // Return the same API as the previous context-based implementation
    return {
        user,
        isLoading,
        setUser,
        clearUser
    };
}

// We don't need to initialize auth on module load anymore
// as the AuthProvider component will handle initialization when mounted
