import {Button} from "@/components/ui";
import {useTranslation} from "react-i18next";
import {Toaster} from "@/components/ui/sonner";
import {AppRoutes, clearUser} from "@/lib";
import {useAuth} from "@/lib/hooks/useAuth";

export function Header() {
    const {t} = useTranslation();
    const {user} = useAuth();

    const handleLogout = async () => {
        try {
            await clearUser();
            // Redirect to home page after logout
            window.location.href = AppRoutes.HOME;
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
                        <a href={AppRoutes.HOME} className="text-xl font-bold">Brickify</a>
                    </div>
                    <nav>
                        <ul className="flex space-x-4 items-center">
                            <li>
                                <a href={AppRoutes.HOME}
                                   className="hover:text-primary transition-colors">{t('header.home')}</a>
                            </li>
                            <li>
                                <a href={AppRoutes.DASHBOARD}
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
