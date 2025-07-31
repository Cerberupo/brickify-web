import {Button} from "@/components/ui/button";
import {useTranslation} from "react-i18next";

export function Header() {
    const {t} = useTranslation();

    return (
        <header className="bg-background border-b border-border">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center">
                    <a href="/" className="text-xl font-bold">Brickify</a>
                </div>
                <nav>
                    <ul className="flex space-x-4 items-center">
                        <li>
                            <a href="/" className="hover:text-primary transition-colors">{t('header.home')}</a>
                        </li>
                        <li>
                            <a href="/dashboard"
                               className="hover:text-primary transition-colors">{t('header.dashboard')}</a>
                        </li>
                        <li>
                            <Button variant="outline" size="sm">{t('header.login')}</Button>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>)
}