import i18n from 'i18next';
import {initReactI18next, useTranslation} from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEN from '../i18n/en.json';
import translationES from '../i18n/es.json';
import {useEffect} from "react";

const supportedLngs = ['en', 'es'];
// Initialize i18next
const getInitialLng = (): 'en' | 'es' => {
    if (typeof window !== 'undefined') {
        const seg = window.location.pathname.split('/')[1]?.toLowerCase();
        if (seg === 'es') return 'es';
        if (seg === 'en') return 'en';
    }
    return 'en';
};

i18n
    // Detect user language
    .use(LanguageDetector)
    // Pass the i18n instance to react-i18next
    .use(initReactI18next)
    // Initialize i18next
    .init({
        // Default language
        fallbackLng: 'en',
        lng: getInitialLng(),
        // Make initialization synchronous to avoid flicker/mismatch on first render
        initImmediate: false,
        // Debug mode
        debug: false,
        // Namespace
        ns: ['common'],
        // Supported languages
        supportedLngs,
        // Static resources
        resources: {
            en: {
                common: translationEN
            },
            es: {
                common: translationES
            }
        },
        detection: {
            // Prioritize URL path ("/es" or "/en") and <html lang>, then fallbacks
            order: ['path', 'htmlTag', 'cookie', 'localStorage', 'navigator', 'querystring', 'sessionStorage'],
            lookupFromPathIndex: 0,
        },
        // Interpolation configuration
        interpolation: {
            escapeValue: false // React already escapes values
        },
        // React suspense configuration
        react: {
            useSuspense: true,
            bindI18n: 'languageChanged loaded',
            bindI18nStore: 'added removed',
            transEmptyNodeValue: '',
            transSupportBasicHtmlNodes: true,
            transKeepBasicHtmlNodesFor: ['br', 'strong', 'i']
        }
    });

export function I18nProvider({children}: { children: React.ReactNode }) {
    const {i18n, ready} = useTranslation();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const getPathLang = (): 'en' | 'es' => {
            const seg = window.location.pathname.split('/')[1]?.toLowerCase();
            return seg === 'es' ? 'es' : 'en';
        };

        const sync = () => {
            const next = getPathLang();
            if (i18n.language !== next) {
                i18n.changeLanguage(next);
            }
        };

        // Sync on mount and on every Astro client navigation
        sync();
        window.addEventListener('astro:page-load', sync);
        window.addEventListener('astro:after-swap', sync);
        return () => {
            window.removeEventListener('astro:page-load', sync);
            window.removeEventListener('astro:after-swap', sync);
        };
    }, [i18n]);

    if (!ready) return null;

    return children;
}
