import {useAuthContext} from '../stores/authStore';

// Hook to use auth state in React components
export function useAuth() {
    return useAuthContext();
}
