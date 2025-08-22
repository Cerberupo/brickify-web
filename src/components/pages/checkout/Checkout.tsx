import React, {useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {loadStripe} from '@stripe/stripe-js';
import {EmbeddedCheckout, EmbeddedCheckoutProvider} from '@stripe/react-stripe-js';
import {STRIPE_PUBLISHABLE_KEY} from '@/config';
import {createGroupCheckoutSession} from '@/lib/services/stripe';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export default function CheckoutPage() {
    const {t} = useTranslation();
    const fetchClientSecret = useCallback(async () => {
        const params = new URLSearchParams(window.location.search);
        const groupId = params.get('groupId');
        if (!groupId) {
            throw new Error('Missing groupId');
        }
        const {clientSecret} = await createGroupCheckoutSession(groupId, `${window.location.origin}/checkout/return`);
        return clientSecret;
    }, []);

    const options = {
        fetchClientSecret,

    } as any;

    return (
        <section className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">{t('checkout.title', 'Checkout')}</h1>
            <div id="checkout" className="min-h-[600px]">
                <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                    <EmbeddedCheckout/>
                </EmbeddedCheckoutProvider>
            </div>
        </section>
    );
}
