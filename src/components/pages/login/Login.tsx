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

    // Redirect to dashboard if user is already logged in
    useEffect(() => {
        if (user && !authLoading) {
            navigate(localizePath('/dashboard'));
        }
    }, [user, authLoading]);

    // Mostrar toast si venimos de un registro (checkEmail=1) o tras reset de contraseña (resetSuccess=1)
    useEffect(() => {
        // Preferir la query inicial proporcionada por Astro (para evitar pérdidas por redirecciones previas)
        const search = initialSearch ? initialSearch : (typeof window !== 'undefined' ? window.location.search : '');
        const params = new URLSearchParams(search || '');
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
