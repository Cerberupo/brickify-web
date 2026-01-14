import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui";
import {Coins, CreditCard, History, LayoutDashboard, LogOut} from "lucide-react";
import {useTranslation} from "react-i18next";
import {clearUser} from "@/lib";
import {useAuth} from "@/lib/hooks/useAuth";
import {navigate} from "@/lib/utils";
import {PROJECT_NAME} from '@/config';
import {buttonVariants} from "@/components/ui/button";
import {useEffect, useRef, useState} from "react";
import {createBillingPortalSession} from '@/lib/services/stripe';
import {toast} from 'sonner';
import {updateLanguagePreference} from '@/lib/services/auth';
import {setUser as setUserStore} from '@/lib/stores/authStore';
import {
    getCurrentLocale,
    homeHref as makeHomeHref,
    localizePath,
    loginHref as makeLoginHref,
    registerHref as makeRegisterHref,
    switchToLocale
} from '@/lib/localeLinks';

export function Header({alternates}: { alternates?: Array<{ href: string; hrefLang: string }> }) {
    const {t, i18n} = useTranslation();
    const {user} = useAuth();
    const [portalLoading, setPortalLoading] = useState(false);

    const handleLogout = async () => {
        try {
            await clearUser();
            // Redirect to localized home page after logout
            navigate(makeHomeHref());
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleOpenInvoices = async () => {
        if (portalLoading) return;
        try {
            setPortalLoading(true);


            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const returnUrl = `${origin.replace(/\/$/, '')}/`;
            // La firma de createBillingPortalSession es (customerId?, returnUrl?)
            const {url} = await createBillingPortalSession(undefined, returnUrl);
            if (url) {
                // Abrir el portal en una pestaña nueva siguiendo buenas prácticas de seguridad
                window.open(url, '_blank', 'noopener,noreferrer');
            } else {
                const msg2 = i18n.language === 'es'
                    ? 'No se pudo abrir el portal de facturación.'
                    : 'Failed to open billing portal.';
                try {
                    toast.error(msg2);
                } catch {
                    alert(msg2);
                }
            }
        } catch (e) {
            console.error('Billing portal error:', e);
            const msg = i18n.language === 'es'
                ? 'No se pudo abrir el portal de facturación.'
                : 'Failed to open billing portal.';
            try {
                toast.error(msg);
            } catch {
                alert(msg);
            }
        } finally {
            setPortalLoading(false);
        }
    };

    const [currentLang, setCurrentLang] = useState<'en' | 'es'>(() => {
        if (typeof document !== 'undefined') {
            const lang = (document.documentElement?.lang || '').toLowerCase();
            if (lang === 'es' || lang === 'en') return lang as 'es' | 'en';
        }
        if (typeof window !== 'undefined') {
            const path = window.location.pathname.toLowerCase();
            if (path.startsWith('/es')) return 'es';
            if (path.startsWith('/en')) return 'en';
        }
        return 'en';
    });

    // Track full path (pathname + search + hash) to build locale switch URLs on the client
    const [fullPath, setFullPath] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return window.location.pathname + window.location.search + window.location.hash;
        }
        return '/';
    });

    // Keep language in sync on client navigations (Astro transitions)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const updateLang = () => {
            const path = window.location.pathname.toLowerCase();
            // Prefer <html lang> when available; fallback to path prefix; default 'en'
            const docLang = (document?.documentElement?.lang || '').toLowerCase();
            const next: 'es' | 'en' = docLang === 'es' ? 'es' : (path.startsWith('/es') ? 'es' : (path.startsWith('/en') ? 'en' : 'en'));
            setCurrentLang(next);
            setFullPath(window.location.pathname + window.location.search + window.location.hash);
            // Ensure i18n language stays in sync even when Header is rendered without I18nProvider
            if (i18n.language !== next) {
                i18n.changeLanguage(next);
            }
        };
        updateLang();
        window.addEventListener('astro:after-swap', updateLang);
        window.addEventListener('astro:page-load', updateLang);
        window.addEventListener('popstate', updateLang);
        return () => {
            window.removeEventListener('astro:after-swap', updateLang);
            window.removeEventListener('astro:page-load', updateLang);
            window.removeEventListener('popstate', updateLang);
        };
    }, [i18n]);

    // Redirección automática al idioma preferido del usuario si no coincide con la URL actual
    const redirectingRef = useRef(false);
    useEffect(() => {
        try {
            if (redirectingRef.current) return;
            const preferred = (user && (user as any).language) as 'es' | 'en' | undefined;
            if (!preferred) return;
            if (preferred !== currentLang) {
                redirectingRef.current = true;
                // No esperamos la actualización en backend para redirigir
                updateLanguagePreference(preferred).catch(() => {
                });
                const target = getTargetHref(preferred);
                const currentFull = (typeof window !== 'undefined')
                    ? (window.location.pathname + window.location.search + window.location.hash)
                    : '';
                // Si ya estamos en la URL objetivo, no redirigir
                if (target === currentFull) {
                    redirectingRef.current = false;
                    return;
                }
                window.location.href = target;
            }
        } catch {
        }
    }, [user, currentLang, fullPath]);

    const langNow = getCurrentLocale();
    const loginHref = makeLoginHref(langNow);
    const registerHref = makeRegisterHref(langNow);

    // Build language switch hrefs on client to preserve current path and query
    // If alternates are provided, use them for specific language redirection
    const getTargetHref = (target: 'es' | 'en') => {
        if (alternates && alternates.length > 0) {
            const match = alternates.find(a => a.hrefLang === target || (target === 'en' && a.hrefLang === 'x-default'));
            if (match) return match.href;
        }
        return switchToLocale(target, fullPath);
    };

    const hrefEs = getTargetHref('es');
    const hrefEn = getTargetHref('en');

    // Handler para clic en cambio de idioma: envía PATCH, sincroniza sesión cliente e i18n, y redirige con un pequeño retardo
    const handleLangClick = (lang: 'es' | 'en') => (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        try {
            updateLanguagePreference(lang);
        } catch {
        }
        // Sincronizar inmediatamente el estado local del usuario e i18n para evitar rebotes
        try {
            if (user) {
                const nextUser = {...(user as any), language: lang};
                setUserStore(nextUser as any);
            }
            if (i18n.language !== lang) {
                i18n.changeLanguage(lang);
            }
        } catch {
        }
        const target = getTargetHref(lang);
        // Pequeño retraso para evitar que el navegador cancele la petición PATCH por navegación inmediata
        window.setTimeout(() => {
            window.location.href = target;
        }, 150);
    };

    return (
        <>
            <header className="bg-background border-b border-border sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center">
                        <a href={makeHomeHref(langNow)} className="flex items-center gap-2">
                            <img src="/logo.svg" alt={PROJECT_NAME} className="h-5 w-auto"/>
                            <span className="sr-only">{PROJECT_NAME}</span>
                        </a>
                    </div>
                    <nav>
                        <ul className="flex space-x-4 items-center">

                            {/* Language selector */}
                            <li className="flex items-center gap-2">
                                <a
                                    href={hrefEs}
                                    onClick={handleLangClick('es')}
                                    className={`text-sm transition-colors ${currentLang === 'es' ? 'font-bold' : 'opacity-70 hover:opacity-100'}`}
                                    aria-current={currentLang === 'es' ? 'true' : undefined}
                                >
                                    ES
                                </a>
                                <span className="text-muted-foreground">/</span>
                                <a
                                    href={hrefEn}
                                    onClick={handleLangClick('en')}
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
                                <li className="ml-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={(user as any).avatar} alt={user.name || ''}/>
                                                    <AvatarFallback>{(user.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56" align="end" forceMount>
                                            <DropdownMenuLabel className="font-normal">
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                                    <p className="text-xs leading-none text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator/>
                                            <DropdownMenuItem className="flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <Coins className="mr-2 h-4 w-4 text-yellow-500"/>
                                                    <span>{t('header.balance', {defaultValue: 'Balance'})}</span>
                                                </div>
                                                <span className="font-bold">{(user as any).balance || 0}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator/>
                                            <DropdownMenuItem onClick={() => navigate(localizePath('/dashboard'))}>
                                                <LayoutDashboard className="mr-2 h-4 w-4"/>
                                                <span>{t('header.dashboard')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => navigate(localizePath('/recharge'))}>
                                                <CreditCard className="mr-2 h-4 w-4"/>
                                                <span>{t('header.recharge', {defaultValue: 'Recharge Credits'})}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => navigate(localizePath('/transactions'))}>
                                                <History className="mr-2 h-4 w-4"/>
                                                <span>{t('header.transactions', {defaultValue: 'My Transactions'})}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleOpenInvoices} disabled={portalLoading}>
                                                <CreditCard className="mr-2 h-4 w-4"/>
                                                <span>{t('header.invoices', {defaultValue: 'Invoices'})}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator/>
                                            <DropdownMenuItem onClick={handleLogout}
                                                              className="text-red-600 focus:text-red-600">
                                                <LogOut className="mr-2 h-4 w-4"/>
                                                <span>{t('header.logout')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </li>
                            ) : null}
                        </ul>
                    </nav>
                </div>
            </header>
        </>)
}
