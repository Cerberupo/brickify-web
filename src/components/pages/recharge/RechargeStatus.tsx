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
        const urlParams = new URLSearchParams(window.location.search);
        const statusParam = urlParams.get('status');
        setStatus(statusParam);

        if (statusParam === 'success') {
            // Refresh profile to get updated balance
            getProfile().finally(() => {
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
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
