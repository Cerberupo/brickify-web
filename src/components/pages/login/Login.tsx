import {useTranslation} from 'react-i18next';
import {LoginForm} from "@/components/pages/login/components";
import {GoogleAuthProvider, useAuth} from "@/lib";
import {useEffect} from 'react';
import {navigate} from '@/lib/utils';
import {PROJECT_NAME} from '@/config';
import {homeHref as makeHomeHref, localizePath} from '@/lib/localeLinks';
import {toast} from 'sonner';
import {Toaster} from "@/components";

type LoginPageProps = { initialSearch?: string };

export function LoginPage({initialSearch}: LoginPageProps) {
    const {t} = useTranslation();
    const {user, isLoading: authLoading} = useAuth();

    // Handle token from URL (for "impersonate" from BO)
    useEffect(() => {
        const params = getParams();
        const token = params.get('token');
        if (token && typeof window !== 'undefined') {
            localStorage.setItem('authToken', token);
            // Redirigir al dashboard para que el initAuth se encargue del resto
            navigate(localizePath('/dashboard'));
        }
    }, [initialSearch]);

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
                navigate(localizePath('/dashboard'));
            }
        }
    }, [user, authLoading]);

    // Mostrar toast si venimos de un registro (checkEmail=1) o tras reset de contraseña (resetSuccess=1)
    useEffect(() => {
        const params = getParams();
        const checkEmail = params.get('checkEmail');
        const resetSuccess = params.get('resetSuccess');
        if (checkEmail) {
            toast.success(t('register.verifyEmailSent', "We've sent you an email to verify your account. Please check your inbox and follow the instructions."));
        }
        if (resetSuccess) {
            toast.success(t('reset.successMessage', 'Your password has been reset successfully. You can now sign in.'));
        }
        // Limpiar los query params para evitar mostrarlo de nuevo si el usuario recarga
        if ((checkEmail || resetSuccess) && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (checkEmail) url.searchParams.delete('checkEmail');
            if (resetSuccess) url.searchParams.delete('resetSuccess');
            window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
        }
    }, [initialSearch, t]);

    return (
        <div className="grid place-items-center py-20 content-center">
            <Toaster position="top-right"/>
            <a href={makeHomeHref()} className="mb-8 inline-flex items-center gap-2"
               aria-label={PROJECT_NAME || 'Brickify'}>
                <img src="/logo.svg" alt={PROJECT_NAME || 'Brickify'} className="h-10 w-auto"/>
                <span className="sr-only">{PROJECT_NAME || 'Brickify'}</span>
            </a>
            <GoogleAuthProvider>
                <LoginForm redirect={getParams().get('redirect') || undefined}/>
            </GoogleAuthProvider>
        </div>
    )

}
