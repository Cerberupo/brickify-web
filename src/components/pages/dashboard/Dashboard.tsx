import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui";
import { AppRoutes } from '@/lib';

export function DashboardPage() {
    const { t } = useTranslation();

    const handleLogout = () => {
        // In a real app, you would handle logout logic here
        console.log('Logging out...');
        window.location.href = AppRoutes.LOGIN;
    };

    return (
        <div className="container mx-auto p-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
                <div>
                    <Button onClick={handleLogout} variant="outline">{t('dashboard.logout')}</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Dashboard Cards */}
                <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-2">{t('dashboard.welcome')}</h2>
                    <p className="text-muted-foreground">{t('dashboard.welcomeMessage')}</p>
                </div>

                <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-2">{t('dashboard.recentActivity')}</h2>
                    <p className="text-muted-foreground">{t('dashboard.noRecentActivity')}</p>
                </div>

                <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-2">{t('dashboard.quickActions')}</h2>
                    <div className="flex flex-col gap-2">
                        <Button>{t('dashboard.createNewProject')}</Button>
                        <Button variant="outline">{t('dashboard.viewSettings')}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}