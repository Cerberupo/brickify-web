import {useTranslation} from 'react-i18next';
import {RegisterForm} from "@/components/pages/register/components";
import {useEffect} from 'react';
import {useAuth} from '@/lib';
import {APP_ROUTES} from '@/constants/routes';
import {navigate} from '@/lib/utils';
import {PROJECT_NAME} from '@/config';
import {homeHref as makeHomeHref} from '@/lib/localeLinks';
import {Toaster} from "@/components";

type RegisterPageProps = { initialSearch?: string };

export function RegisterPage({initialSearch}: RegisterPageProps) {
    const {t} = useTranslation();
    const {user, isLoading: authLoading} = useAuth();

    // Separate params parsing to be reused
    const getParams = () => {
        const search = initialSearch ? initialSearch : (typeof window !== 'undefined' ? window.location.search : '');
        return new URLSearchParams(search || '');
    };

    // Redirect to dashboard if user is already logged in
    useEffect(() => {
        if (user && !authLoading) {
            const params = getParams();
            const redirectTo = params.get('redirect');
            if (redirectTo) {
                navigate(localizePath(redirectTo));
            } else {
                navigate(APP_ROUTES.DASHBOARD);
            }
        }
    }, [user, authLoading]);

    return (
        <div className="grid place-items-center py-20 content-center">
            <Toaster position="top-right"/>
            <a href={makeHomeHref()} className="mb-8 inline-flex items-center gap-2">
                <img src="/logo.svg" alt={PROJECT_NAME} className="h-10 w-auto"/>
                <span className="sr-only">{PROJECT_NAME}</span>
            </a>
            <RegisterForm redirect={getParams().get('redirect') || undefined}/>
        </div>
    )
}
