import {Button} from "@/components/ui";
import {useTranslation} from "react-i18next";
import {Toaster} from "@/components/ui/sonner";
import {clearUser} from "@/lib";
import {APP_ROUTES} from '@/constants/routes';
import {useAuth} from "@/lib/hooks/useAuth";
import {navigate} from "@/lib/utils";
import logo from '@/images/logo.png';
import {PROJECT_NAME} from '@/config';

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

    return (
        <>
            <Toaster position="top-right"/>
            <header className="bg-background border-b border-border">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center">
                        <a href={APP_ROUTES.HOME} className="flex items-center gap-2">
                            <img src={logo.src} alt={PROJECT_NAME} className="h-5 w-auto"/>
                            <span className="sr-only">{PROJECT_NAME}</span>
                        </a>
                    </div>
                    <nav>
                        <ul className="flex space-x-4 items-center">
                            <li>
                                <a href={APP_ROUTES.HOME}
                                   className="hover:text-primary transition-colors">{t('header.home')}</a>
                            </li>
                            <li>
                                <a href={APP_ROUTES.DASHBOARD}
                                   className="hover:text-primary transition-colors">{t('header.dashboard')}</a>
                            </li>
                            {user ? (
                                <li>
                                    <Button variant="outline" size="sm"
                                            onClick={handleLogout}>{t('header.logout')}</Button>
                                </li>
                            ) : null}
                        </ul>
                    </nav>
                </div>
            </header>
        </>)
}
