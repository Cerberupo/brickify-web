import {useTranslation} from "react-i18next";
import {AppRoutes} from "@/lib";

export function Footer() {
    const {t} = useTranslation();
    return (
        <footer className="bg-background border-t border-border mt-auto">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <p className="text-sm text-muted-foreground">© 2025
                            Brickify. {t('footer.allRightsReserved')}</p>
                    </div>
                    <div className="flex space-x-6">
                        <a href={AppRoutes.TERMS}
                           className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {t('footer.termsOfService')}
                        </a>
                        <a href={AppRoutes.PRIVACY}
                           className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {t('footer.privacyPolicy')}
                        </a>
                        <a href={AppRoutes.CONTACT}
                           className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {t('footer.contactUs')}
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
