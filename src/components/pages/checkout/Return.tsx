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

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        if (!sessionId) return;
        getEmbeddedSessionStatus(sessionId)
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
        return (
            <section className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">{t('checkout.errorOpenTitle', 'Pago no completado')}</h1>
                <p className="mb-4">{t('checkout.errorOpenMessage', 'No se ha podido procesar el pedido o el pago no se ha completado.')}</p>
                {groupId ? (
                    <Button onClick={() => navigate(APP_ROUTES.GROUP, {id: groupId})}>
                        {t('checkout.backToGroup', 'Back to group')}
                    </Button>
                ) : (
                    <Button onClick={() => navigate(APP_ROUTES.DASHBOARD)}>
                        {t('checkout.backToGroup', 'Back to group')}
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
        return (
            <section className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-2">{t('checkout.successTitle', 'Thank you!')}</h1>
                <p className="mb-6 text-sm text-gray-700">
                    {t('checkout.postOrderCopy', "Thanks for your order! We’ll review your group and select the pieces to request. When everything is ready, we’ll email you the selection so you can confirm before we place the order and prepare it for shipping to the address you provided.")}
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
                    {/* Shipping and Meta */}
                    <div className="border rounded-md p-4">
                        <h2 className="text-lg font-semibold mb-3">{t('checkout.shippingTo', 'Shipping to')}</h2>
                        {details?.shipping_details?.address ? (
                            <div className="text-sm">
                                <div className="font-medium">{details?.shipping_details?.name || ''}</div>
                                <div>{details.shipping_details.address.line1}</div>
                                {details.shipping_details.address.line2 ?
                                    <div>{details.shipping_details.address.line2}</div> : null}
                                <div>{details.shipping_details.address.postal_code} {details.shipping_details.address.city}</div>
                                <div>{details.shipping_details.address.state}</div>
                                <div>{details.shipping_details.address.country}</div>
                            </div>
                        ) : (
                            <div
                                className="text-sm text-gray-500">{t('checkout.noShipping', 'No shipping address')}</div>
                        )}

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
                    {groupId ? (
                        <Button onClick={() => navigate(APP_ROUTES.GROUP, {id: groupId})}>
                            {t('checkout.backToGroup', 'Back to group')}
                        </Button>
                    ) : (
                        <Button onClick={() => navigate(APP_ROUTES.DASHBOARD)}>
                            {t('checkout.backToGroup', 'Back to group')}
                        </Button>
                    )}
                </div>
            </section>
        );
    }

    return null;
}
