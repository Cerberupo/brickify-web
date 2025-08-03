import {useTranslation} from 'react-i18next';
import {LoginForm} from "@/components/pages/login/components";
import {GoogleAuthProvider, AppRoutes, useAuth} from "@/lib";
import {useEffect} from 'react';

export function LoginPage() {
    const {t} = useTranslation();
    const {user, isLoading: authLoading} = useAuth();

    // Redirect to dashboard if user is already logged in
    useEffect(() => {
        if (user && !authLoading) {
            window.location.href = AppRoutes.DASHBOARD;
        }
    }, [user, authLoading]);

    return (<div className="grid place-items-center py-20 content-center">
        <GoogleAuthProvider>
            <LoginForm/>
        </GoogleAuthProvider>
    </div>)

}
