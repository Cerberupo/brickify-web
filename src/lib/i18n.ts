import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEN from '../i18n/en.json';
import translationES from '../i18n/es.json';

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
        defaultNS: 'common',
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
        }
    });

