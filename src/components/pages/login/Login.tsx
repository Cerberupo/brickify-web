import {useTranslation} from 'react-i18next';
import {LoginForm} from "@/components/pages/login/components";
import {GoogleAuthProvider, useAuth} from "@/lib";
import {APP_ROUTES} from '@/constants/routes';
import {useEffect} from 'react';
import {navigate} from '@/lib/utils';

export function LoginPage() {
    const {t} = useTranslation();
    const {user, isLoading: authLoading} = useAuth();

    // Redirect to dashboard if user is already logged in
    useEffect(() => {
        if (user && !authLoading) {
            navigate(APP_ROUTES.DASHBOARD);
        }
    }, [user, authLoading]);

    return (<div className="grid place-items-center py-20 content-center">
        <GoogleAuthProvider>
            <LoginForm/>
        </GoogleAuthProvider>
    </div>)

}
