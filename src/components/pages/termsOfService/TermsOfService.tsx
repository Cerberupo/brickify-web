import React, {useEffect} from 'react';
import {useTranslation} from 'react-i18next';

export function TermsOfServicePage() {
    const {t} = useTranslation();
    useEffect(() => {
        console.log('carga terms');
    }, []);
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">{t('termsOfService.title')}</h1>
            <p className="text-sm text-muted-foreground mb-6">{t('termsOfService.lastUpdated')}</p>

            <p className="mb-8">{t('termsOfService.introduction')}</p>

            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-semibold mb-2">{t('termsOfService.sections.acceptance.title')}</h2>
                    <p>{t('termsOfService.sections.acceptance.content')}</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">{t('termsOfService.sections.changes.title')}</h2>
                    <p>{t('termsOfService.sections.changes.content')}</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">{t('termsOfService.sections.accountTerms.title')}</h2>
                    <p>{t('termsOfService.sections.accountTerms.content')}</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">{t('termsOfService.sections.intellectualProperty.title')}</h2>
                    <p>{t('termsOfService.sections.intellectualProperty.content')}</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">{t('termsOfService.sections.termination.title')}</h2>
                    <p>{t('termsOfService.sections.termination.content')}</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">{t('termsOfService.sections.limitation.title')}</h2>
                    <p>{t('termsOfService.sections.limitation.content')}</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">{t('termsOfService.sections.governing.title')}</h2>
                    <p>{t('termsOfService.sections.governing.content')}</p>
                </section>
            </div>

            <div className="mt-10 pt-6 border-t">
                <p>{t('termsOfService.contact')}</p>
            </div>
        </div>
    );
}