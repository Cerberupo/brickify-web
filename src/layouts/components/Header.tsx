import {Button} from "@/components/ui";
import {useTranslation} from "react-i18next";
import {Toaster} from "@/components/ui/sonner";
import {clearUser} from "@/lib";
import {APP_ROUTES} from '@/constants/routes';
import {useAuth} from "@/lib/hooks/useAuth";
import {navigate} from "@/lib/utils";
import logo from '@/images/logo.png';
import {PROJECT_NAME} from '@/config';
import {buttonVariants} from "@/components/ui/button";
import {useEffect, useState} from "react";

export function Header() {
    const {t} = useTranslation();
    const {user} = useAuth();

    const handleLogout = async () => {
        try {
            await clearUser();
            // Redirect to home page after logout
            navigate(APP_ROUTES.HOME);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const [currentLang, setCurrentLang] = useState<'en' | 'es'>('en');
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname.toLowerCase();
            if (path.startsWith('/es')) setCurrentLang('es');
            else if (path.startsWith('/en')) setCurrentLang('en');
            else setCurrentLang('en');
        }
    }, []);

    return (
        <>
            <Toaster position="top-right"/>
            <header className="bg-background border-b border-border relative z-10">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center">
                        <a href={APP_ROUTES.HOME} className="flex items-center gap-2">
                            <img src={logo.src} alt={PROJECT_NAME} className="h-5 w-auto"/>
                            <span className="sr-only">{PROJECT_NAME}</span>
                        </a>
                    </div>
                    <nav>
                        <ul className="flex space-x-4 items-center">
                            {user ? (
                                <li>
                                    <a href={APP_ROUTES.DASHBOARD}
                                       className="hover:text-primary transition-colors">{t('header.dashboard')}</a>
                                </li>
                            ) : null}

                            {/* Language selector */}
                            <li className="flex items-center gap-2">
                                <a
                                    href={APP_ROUTES.SPANISH}
                                    className={`text-sm transition-colors ${currentLang === 'es' ? 'font-bold' : 'opacity-70 hover:opacity-100'}`}
                                    aria-current={currentLang === 'es' ? 'true' : undefined}
                                >
                                    ES
                                </a>
                                <span className="text-muted-foreground">/</span>
                                <a
                                    href={APP_ROUTES.ENGLISH}
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
                                            href={APP_ROUTES.LOGIN}
                                            className={buttonVariants({variant: "outline", size: "sm"})}
                                        >
                                            {t('header.login', {defaultValue: 'Login'})}
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href={APP_ROUTES.REGISTER}
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
