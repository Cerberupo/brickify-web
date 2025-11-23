import {Button} from "@/components/ui";
import {useTranslation} from "react-i18next";
import {clearUser} from "@/lib";
import {useAuth} from "@/lib/hooks/useAuth";
import {navigate} from "@/lib/utils";
import {PROJECT_NAME} from '@/config';
import {buttonVariants} from "@/components/ui/button";
import {useEffect, useState} from "react";
import {
    getCurrentLocale,
    homeHref as makeHomeHref,
    localizePath,
    loginHref as makeLoginHref,
    registerHref as makeRegisterHref,
    switchToLocale
} from '@/lib/localeLinks';

export function Header() {
    const {t} = useTranslation();
    const {user} = useAuth();

    const handleLogout = async () => {
        try {
            await clearUser();
            // Redirect to localized home page after logout
            navigate(makeHomeHref());
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const [currentLang, setCurrentLang] = useState<'en' | 'es'>(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname.toLowerCase();
            if (path.startsWith('/es')) return 'es';
            if (path.startsWith('/en')) return 'en';
        }
        return 'en';
    });

    // Keep language in sync on client navigations (Astro transitions)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const updateLang = () => {
            const path = window.location.pathname.toLowerCase();
            setCurrentLang(path.startsWith('/es') ? 'es' : 'en');
        };
        updateLang();
        window.addEventListener('astro:after-swap', updateLang);
        window.addEventListener('astro:page-load', updateLang);
        return () => {
            window.removeEventListener('astro:after-swap', updateLang);
            window.removeEventListener('astro:page-load', updateLang);
        };
    }, []);

    const langNow = getCurrentLocale();
    const loginHref = makeLoginHref(langNow);
    const registerHref = makeRegisterHref(langNow);

    return (
        <>
            <header className="bg-background border-b border-border relative z-10">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center">
                        <a href={makeHomeHref(langNow)} className="flex items-center gap-2">
                            <img src="/logo.svg" alt={PROJECT_NAME} className="h-5 w-auto"/>
                            <span className="sr-only">{PROJECT_NAME}</span>
                        </a>
                    </div>
                    <nav>
                        <ul className="flex space-x-4 items-center">
                            {user ? (
                                <li>
                                    <a href={localizePath('/dashboard')}
                                       className="hover:text-primary transition-colors">{t('header.dashboard')}</a>
                                </li>
                            ) : null}

                            {/* Language selector */}
                            <li className="flex items-center gap-2">
                                <a
                                    href={switchToLocale('es')}
                                    className={`text-sm transition-colors ${currentLang === 'es' ? 'font-bold' : 'opacity-70 hover:opacity-100'}`}
                                    aria-current={currentLang === 'es' ? 'true' : undefined}
                                >
                                    ES
                                </a>
                                <span className="text-muted-foreground">/</span>
                                <a
                                    href={switchToLocale('en')}
                                    className={`text-sm transition-colors ${currentLang === 'en' ? 'font-bold' : 'opacity-70 hover:opacity-100'}`}
                                    aria-current={currentLang === 'en' ? 'true' : undefined}
                                >
                                    EN
                                </a>
                            </li>

                            {/* Auth actions */}
                            {!user ? (
                                <>
                                    <li>
                                        <a
                                            href={loginHref}
                                            className={buttonVariants({variant: "outline", size: "sm"})}
                                        >
                                            {t('header.login', {defaultValue: 'Login'})}
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href={registerHref}
                                            className={buttonVariants({size: "sm"})}
                                        >
                                            {t('header.register', {defaultValue: 'Register'})}
                                        </a>
                                    </li>
                                </>
                            ) : null}

                            {user ? (
                                <li>
                                    <Button variant="outline" size="sm" onClick={handleLogout}>
                                        {t('header.logout')}
                                    </Button>
                                </li>
                            ) : null}
                        </ul>
                    </nav>
                </div>
            </header>
        </>)
}
