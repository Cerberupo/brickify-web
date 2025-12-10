import React, {useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {loadStripe} from '@stripe/stripe-js';
import {EmbeddedCheckout, EmbeddedCheckoutProvider} from '@stripe/react-stripe-js';
import {STRIPE_PUBLISHABLE_KEY} from '@/config';
import {createGroupCheckoutSession} from '@/lib/services/stripe';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

function getGroupId() {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('groupId');
    if (!groupId) {
        throw new Error('Missing groupId');
    }
    return groupId;
}

export default function CheckoutPage() {
    const {t} = useTranslation();


    const fetchClientSecret = useCallback(async () => {
        // 1) Priorizar flujo de grupo usando helper getGroupId (no duplicar lógica)
        try {
            const groupId = getGroupId();
            const {clientSecret} = await createGroupCheckoutSession(groupId, `${window.location.origin}/checkout/return/`);
            return clientSecret;
        } catch {
            // Si falta groupId, continuamos con flujo de invitado
        }

        // 2) Si no hay groupId, intentar flujo de invitado desde sessionStorage
        try {
            const raw = sessionStorage.getItem('guestCheckout');
            if (raw) {
                const parsed = JSON.parse(raw || '{}');
                if (parsed && parsed.clientSecret) {
                    // Consumir y limpiar para evitar reusos accidentales
                    sessionStorage.removeItem('guestCheckout');
                    return parsed.clientSecret as string;
                }
            }
        } catch (_) {
            // Ignorar errores de parseo y continuar
        }

        // 3) Si no hay ni groupId ni clientSecret de invitado, error claro
        throw new Error('Missing checkout context');
    }, []);

    /*
    const onShippingDetailsChange = useCallback(async ({checkoutSessionId, shippingDetails}: any) => {
        console.log('shippingDetails', shippingDetails);
        const response = await calculateShippingOptions(getGroupId(), {
            checkout_session_id: checkoutSessionId,
            shipping_details: shippingDetails,
        })
        

        console.log('response', response);

        if (response.type === 'error') {
            return Promise.resolve({type: "reject", errorMessage: response.message});
        } else {
            return Promise.resolve({type: "accept"});
        }
    }, []);

     */

    const options = {
        fetchClientSecret,
        // onShippingDetailsChange
    } as any;

    return (
        <section className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">{t('checkout.title', 'Checkout')}</h1>
            <div id="checkout" className="min-h-[600px]">
                <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                    <EmbeddedCheckout id="checkout-form"/>
                </EmbeddedCheckoutProvider>
            </div>
        </section>
    );
}
