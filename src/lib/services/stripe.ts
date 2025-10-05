import {fetchApi} from './api';

/** Get Stripe products with unit prices for single user and group entries */
export async function getUnitPrices(): Promise<{
    single: {
        id: string;
        name: string | null;
        unitAmount: number;
        currency: string;
        taxBehavior?: 'inclusive' | 'exclusive' | null
    } | null;
    group: {
        id: string;
        name: string | null;
        unitAmount: number;
        currency: string;
        taxBehavior?: 'inclusive' | 'exclusive' | null
    } | null
}> {
    const payload = await fetchApi<{ status: string; data: { single: any; group: any } }>(
        '/payments/products',
        {method: 'GET'}
    );
    return payload?.data ?? {single: null, group: null};
}

/**
 * Create checkout session for a specific group; backend computes quantity from group size.
 */
export async function createGroupCheckoutSession(groupId: string, returnUrl?: string): Promise<{
    clientSecret: string
}> {
    const data = await fetchApi<{ status: string; clientSecret: string }>(
        `/payments/groups/${encodeURIComponent(groupId)}/checkout`,
        {method: 'POST', body: {returnUrl}}
    );
    return {clientSecret: data.clientSecret};
}

export async function calculateShippingOptions(groupId: string, body: any): Promise<any> {
    return await fetchApi(
        `/payments/groups/${encodeURIComponent(groupId)}/calculate-shipping-options`,
        {method: 'POST', body}
    );
}

/**
 * Get status for Embedded Checkout session
 */
export type EmbeddedSessionDetails = {
    status: string | null;
    payment_status?: string | null;
    customer_email: string | null;
    currency?: string | null;
    amount_subtotal?: number | null;
    amount_total?: number | null;
    total_details?: { amount_discount?: number; amount_shipping?: number; amount_tax?: number } | null;
    shipping_details?: { name?: string | null; address?: any } | null;
    line_items?: Array<{
        id: string;
        description: string | null;
        quantity: number;
        currency: string | null;
        unit_amount: number | null;
        amount_subtotal: number | null;
        amount_total: number | null;
    }>;
};

export async function getEmbeddedSessionStatus(sessionId: string): Promise<EmbeddedSessionDetails> {
    const payload = await fetchApi<{ status: string; data: EmbeddedSessionDetails }>(
        `/payments/embedded/session-status?session_id=${encodeURIComponent(sessionId)}`,
        {method: 'GET'}
    );
    const data = payload?.data as EmbeddedSessionDetails;
    return data;
}
