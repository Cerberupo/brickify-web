import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LoadingScreen() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <LoaderCircle className="w-10 h-10 animate-spin mb-2"/>
            <p className="text-lg font-medium">{t('common.loading')}</p>
        </div>
    );
}