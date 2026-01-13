import {useTranslation} from "react-i18next";
import {
    contactHref as makeContactHref,
    legalHref as makeLegalHref,
    privacyHref as makePrivacyHref,
    refundHref as makeRefundHref
} from '@/lib/localeLinks';

export function Footer() {
    const {t} = useTranslation();

    const legalHref = makeLegalHref();
    const privacyHref = makePrivacyHref();
    const refundHref = makeRefundHref();
    const contactHref = makeContactHref();

    return (
        <footer className="bg-background border-t border-border mt-auto">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <p className="text-sm text-muted-foreground">{t('footer.allRightsReserved')}</p>
                    </div>
                    <div className="flex space-x-6">
                        <a href={legalHref}
                           className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {t('footer.termsOfService')}
                        </a>
                        <a href={privacyHref}
                           className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {t('footer.privacyPolicy')}
                        </a>
                        <a href={refundHref}
                           className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {t('footer.refundPolicy')}
                        </a>
                        <a href={contactHref}
                           className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {t('footer.contactUs')}
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
