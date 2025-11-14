import {useTranslation} from 'react-i18next';
import {LoginForm} from "@/components/pages/login/components";
import {GoogleAuthProvider, useAuth} from "@/lib";
import {APP_ROUTES} from '@/constants/routes';
import {useEffect} from 'react';
import {navigate} from '@/lib/utils';
import {PROJECT_NAME} from '@/config';
import { homeHref as makeHomeHref, localizePath } from '@/lib/localeLinks';

export function LoginPage() {
    const {t} = useTranslation();
    const {user, isLoading: authLoading} = useAuth();

    // Redirect to dashboard if user is already logged in
    useEffect(() => {
        if (user && !authLoading) {
            navigate(localizePath('/dashboard'));
        }
    }, [user, authLoading]);

    return (
        <div className="grid place-items-center py-20 content-center">
            <a href={makeHomeHref()} className="mb-8 inline-flex items-center gap-2">
                <img src="/logo.svg" alt={PROJECT_NAME} className="h-10 w-auto"/>
                <span className="sr-only">{PROJECT_NAME}</span>
            </a>
            <GoogleAuthProvider>
                <LoginForm/>
            </GoogleAuthProvider>
        </div>
    )

}
