import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {type EmbeddedSessionDetails, getEmbeddedSessionStatus} from '@/lib/services/stripe';
import {Button} from '@/components/ui/button';
import {navigate} from "@/lib";
import {APP_ROUTES} from "@/constants";

export default function CheckoutReturnPage() {
    const {t} = useTranslation();
    const [status, setStatus] = useState<string | null>(null);
    const [details, setDetails] = useState<EmbeddedSessionDetails | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [guestParams, setGuestParams] = useState<{
        groupId: string;
        sessionId: string;
        guestKey: string
    } | null>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const guestKey = urlParams.get('guest_key')
        const groupId = urlParams.get('groupId')
        // Detectar si es un pedido guest: si llegan los 3 parámetros
        if (groupId && sessionId && guestKey) {
            setIsGuest(true);
            setGuestParams({groupId, sessionId, guestKey});
        }
        if (!sessionId) return;
        getEmbeddedSessionStatus(sessionId, guestKey)
            .then((data) => {
                setStatus(data?.status || null);
                setDetails(data);
            })
            .catch(() => {
            });
    }, []);

    if (status === 'open') {
        const params = new URLSearchParams(window.location.search);
        const groupId = params.get('groupId');
        const goHomeWithGuestParams = () => {
            // Inferir locale por la ruta actual
            const loc = window.location.pathname.startsWith('/es') ? 'es' : 'en';
            const q = new URLSearchParams({
                groupId: guestParams!.groupId,
                guest_key: guestParams!.guestKey,
            }).toString();
            // Mantener query y añadir ancla a la sección de reseñas en home
            window.location.href = `/${loc}/?${q}#preview`;
        };
        return (
            <section className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">{t('checkout.errorOpenTitle', 'Pago no completado')}</h1>
                <p className="mb-4">{t('checkout.errorOpenMessage', 'No se ha podido procesar el pedido o el pago no se ha completado.')}</p>
                {isGuest && guestParams ? (
                    <Button onClick={goHomeWithGuestParams}>
                        {window.location.pathname.startsWith('/es') ? 'Volver a inicio' : 'Back to home'}
                    </Button>
                ) : groupId ? (
                    <Button onClick={() => navigate(APP_ROUTES.GROUP, {id: groupId})}>
                        {t('checkout.backToGroup', 'Back to collection')}
                    </Button>
                ) : (
                    <Button onClick={() => navigate(APP_ROUTES.DASHBOARD)}>
                        {t('checkout.backToGroup', 'Back to collection')}
                    </Button>
                )}
            </section>
        );
    }

    if (status === 'complete') {
        const params = new URLSearchParams(window.location.search);
        const groupId = params.get('groupId');
        const currency = (details?.currency || 'eur').toUpperCase();
        const fmt = (cents?: number | null) => typeof cents === 'number' ? `${(cents / 100).toFixed(2)} €` : '—';
        const goHomeWithGuestParams = () => {
            // Inferir locale por la ruta actual
            const loc = window.location.pathname.startsWith('/es') ? 'es' : 'en';
            const q = new URLSearchParams({
                groupId: guestParams!.groupId,
                guest_key: guestParams!.guestKey,
            }).toString();
            // Mantener query y añadir ancla a la sección de reseñas en home
            window.location.href = `/${loc}/?${q}#preview`;
        };
        return (
            <section className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-2">{t('checkout.successTitle', 'Thank you!')}</h1>
                <p className="mb-6 text-sm text-gray-700">
                    {t('checkout.postOrderCopy', "¡Gracias por tu pedido! Nuestra IA seleccionará las piezas más parecidas posibles a las imágenes y descripciones que nos has proporcionado. Te avisaremos por email cuando esté finalizado para que puedas revisarlo y ver/descargar las instrucciones y la lista de piezas.")}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Order Summary */}
                    <div className="md:col-span-2 border rounded-md p-4">
                        <h2 className="text-lg font-semibold mb-3">{t('checkout.orderSummary', 'Order Summary')}</h2>
                        <div className="divide-y">
                            {(details?.line_items || []).map((it) => (
                                <div key={it.id} className="flex items-center justify-between py-2 text-sm">
                                    <div className="min-w-0">
                                        <div className="font-medium truncate"
                                             title={it.description || ''}>{it.description || t('checkout.item', 'Item')}</div>
                                        <div className="text-gray-500">
                                            {t('checkout.qty', 'Qty')}: {it.quantity} · {t('checkout.unitPrice', 'Unit')}: {fmt(it.unit_amount)}
                                        </div>
                                    </div>
                                    <div className="font-medium">{fmt(it.amount_total)}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t text-sm space-y-1">
                            <div className="flex justify-between">
                                <span>{t('checkout.subtotal', 'Subtotal')}</span><span>{fmt(details?.amount_subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('checkout.tax', 'Tax')}</span><span>{fmt(details?.total_details?.amount_tax ?? 0)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-base">
                                <span>{t('checkout.total', 'Total')}</span><span>{fmt(details?.amount_total)}</span>
                            </div>
                        </div>
                    </div>
                    {/* Next steps and Meta */}
                    <div className="border rounded-md p-4">
                        <h2 className="text-lg font-semibold mb-3">{t('checkout.nextSteps', 'What happens next')}</h2>

                        <div className="mt-4 text-sm">
                            <div><span
                                className="font-medium">{t('checkout.paymentStatus', 'Payment status')}:</span> {details?.payment_status || '-'}
                            </div>
                            <div><span
                                className="font-medium">{t('checkout.email', 'Email')}:</span> {details?.customer_email || '-'}
                            </div>
                            <div><span className="font-medium">{t('checkout.currency', 'Currency')}:</span> {currency}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    {isGuest && guestParams ? (
                        <Button onClick={goHomeWithGuestParams}>
                            {window.location.pathname.startsWith('/es') ? 'Volver a inicio y ver piezas' : 'Back to home and see parts'}
                        </Button>
                    ) : groupId ? (
                        <Button onClick={() => navigate(APP_ROUTES.GROUP, {id: groupId})}>
                            {t('checkout.backToGroup', 'Back to collection')}
                        </Button>
                    ) : (
                        <Button onClick={() => navigate(APP_ROUTES.DASHBOARD)}>
                            {t('checkout.backToGroup', 'Back to collection')}
                        </Button>
                    )}
                </div>
            </section>
        );
    }

    return null;
}
