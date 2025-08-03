import React from 'react';
import { useTranslation } from 'react-i18next';

export function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">{t('privacyPolicy.title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('privacyPolicy.lastUpdated')}</p>
      
      <p className="mb-8">{t('privacyPolicy.introduction')}</p>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-2">{t('privacyPolicy.sections.collection.title')}</h2>
          <p>{t('privacyPolicy.sections.collection.content')}</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-2">{t('privacyPolicy.sections.usage.title')}</h2>
          <p>{t('privacyPolicy.sections.usage.content')}</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-2">{t('privacyPolicy.sections.sharing.title')}</h2>
          <p>{t('privacyPolicy.sections.sharing.content')}</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-2">{t('privacyPolicy.sections.tracking.title')}</h2>
          <p>{t('privacyPolicy.sections.tracking.content')}</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-2">{t('privacyPolicy.sections.rights.title')}</h2>
          <p>{t('privacyPolicy.sections.rights.content')}</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-2">{t('privacyPolicy.sections.changes.title')}</h2>
          <p>{t('privacyPolicy.sections.changes.content')}</p>
        </section>
      </div>
      
      <div className="mt-10 pt-6 border-t">
        <p>{t('privacyPolicy.contact')}</p>
      </div>
    </div>
  );
}