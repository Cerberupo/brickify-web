import React, {useEffect} from 'react';
import {useStore} from '@nanostores/react';
import {APP_ROUTES} from '@/constants/routes';
import {localizePath} from '@/lib/localeLinks';
import {loggingOutAtom, sessionExpiredAtom, useAuthContext} from '@/lib/stores/authStore';

/**
 * Shows its content only to signed-in users. Anyone else goes to the login page and comes back here afterwards.
 * Without this, a page with an expired session looks empty, as if the user's collections were gone.
 */
export function RequireAuth({children}: { children: React.ReactNode }) {
    const {user, isLoading} = useAuthContext();
    const loggingOut = useStore(loggingOutAtom);
    const shouldRedirect = !isLoading && !user && !loggingOut;

    useEffect(() => {
        if (!shouldRedirect) return;
        const params = new URLSearchParams({redirect: window.location.pathname + window.location.search});
        if (sessionExpiredAtom.get()) params.set('sessionExpired', '1');
        // replace: the back button must not return to a page that would redirect again
        window.location.replace(`${localizePath(APP_ROUTES.LOGIN)}?${params.toString()}`);
    }, [shouldRedirect]);

    if (isLoading || !user) return null;

    return <>{children}</>;
}
