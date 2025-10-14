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
        const {clientSecret} = await createGroupCheckoutSession(getGroupId(), `${window.location.origin}/checkout/return/`);
        return clientSecret;
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
                    <EmbeddedCheckout/>
                </EmbeddedCheckoutProvider>
            </div>
        </section>
    );
}
