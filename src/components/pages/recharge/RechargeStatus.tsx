import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button} from '@/components/ui/button';
import {navigate} from "@/lib";
import {localizePath} from "@/lib/localeLinks";
import {CheckCircle2, Loader2, XCircle} from "lucide-react";
import {getProfile} from "@/lib/services/auth";

export default function RechargeStatus() {
    const {t} = useTranslation();
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const updateStatus = () => {
            const urlParams = new URLSearchParams(window.location.search);
            let statusParam = urlParams.get('status');

            // Defensive: if status is missing but session_id is present, it's likely a success redirect that lost params
            if (!statusParam && urlParams.has('session_id')) {
                statusParam = 'success';
            }

            setStatus(statusParam);

            if (statusParam === 'success') {
                // Initial immediate refresh
                getProfile().finally(() => {
                    setLoading(false);
                });

                // Schedule subsequent refreshes at 15s, 30s, and 60s
                // We do NOT clear these in the cleanup function so they persist even if user navigates away
                // (as long as the JS environment stays alive, e.g. Astro view transitions)
                setTimeout(() => {
                    console.log('[recharge] Scheduled refresh at 15s');
                    getProfile().catch(() => {
                    });
                }, 15000);

                setTimeout(() => {
                    console.log('[recharge] Scheduled refresh at 30s');
                    getProfile().catch(() => {
                    });
                }, 30000);

                setTimeout(() => {
                    console.log('[recharge] Scheduled refresh at 60s');
                    getProfile().catch(() => {
                    });
                }, 60000);
            } else {
                setLoading(false);
            }
        };

        updateStatus();

        // Listen for Astro view transitions / page loads
        window.addEventListener('astro:page-load', updateStatus);
        return () => window.removeEventListener('astro:page-load', updateStatus);
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4"/>
                <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
            </div>
        );
    }

    const isSuccess = status === 'success';

    return (
        <section className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-8">
                {isSuccess ? (
                    <>
                        <div className="flex justify-center mb-6">
                            <CheckCircle2 className="h-16 w-16 text-green-500"/>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">
                            {t('recharge.status.successTitle', '¡Recarga completada!')}
                        </h1>
                        <p className="text-muted-foreground mb-8">
                            {t('recharge.status.successMessage', 'Tus tokens han sido añadidos a tu cuenta con éxito. Ya puedes usarlos para tus creaciones.')}
                        </p>
                        <div className="space-y-3">
                            <Button className="w-full" onClick={() => navigate(localizePath('/dashboard'))}>
                                {t('recharge.status.goToDashboard', 'Ir al Dashboard')}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-center mb-6">
                            <XCircle className="h-16 w-16 text-red-500"/>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">
                            {t('recharge.status.cancelTitle', 'Recarga cancelada')}
                        </h1>
                        <p className="text-muted-foreground mb-8">
                            {t('recharge.status.cancelMessage', 'El proceso de recarga ha sido cancelado. No se ha realizado ningún cargo.')}
                        </p>
                        <div className="space-y-3">
                            <Button className="w-full" onClick={() => navigate(localizePath('/recharge'))}>
                                {t('recharge.status.tryAgain', 'Intentar de nuevo')}
                            </Button>
                            <Button variant="outline" className="w-full"
                                    onClick={() => navigate(localizePath('/dashboard'))}>
                                {t('recharge.status.goToDashboard', 'Ir al Dashboard')}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
