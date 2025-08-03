import i18n from 'i18next';
import {initReactI18next, useTranslation} from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEN from '../i18n/en.json';
import translationES from '../i18n/es.json';
import {useEffect} from "react";
import { GoogleOAuthProvider } from '@react-oauth/google';

const supportedLngs = ['en', 'es'];
// Initialize i18next
i18n
    // Detect user language
    .use(LanguageDetector)
    // Pass the i18n instance to react-i18next
    .use(initReactI18next)
    // Initialize i18next
    .init({
        // Default language
        fallbackLng: 'en',
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
        // Only change language based on URL if no language is already set
        // This allows user's stored language preference to take precedence
        if (!i18n.language || i18n.language === 'en') {
            const pathLang = window.location.pathname.split("/")[1]
            const lang = supportedLngs.includes(pathLang) ? pathLang : "en";
            i18n.changeLanguage(lang)
        }
    }, [])

    if (!ready) return null;

    return children;
}
