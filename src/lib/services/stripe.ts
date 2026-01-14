import {fetchApi} from './api';

/**
 * Create a Stripe Billing Portal session and return its URL.
 * If returnUrl is omitted, the backend will choose a safe default.
 */
export async function createBillingPortalSession(returnUrl?: string): Promise<{ url: string }> {
    const payload = await fetchApi<{ status: string; url: string }>(
        '/payments/stripe/portal-session',
        {method: 'POST', body: {returnUrl}}
    );
    return {url: payload.url};
}

/**
 * Get available recharge products
 */
export async function getRechargeProducts(lang?: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    credits: number;
    priceId: string;
    amount: number;
    currency: string;
}>> {
    const payload = await fetchApi<{ status: string; data: any[] }>(
        `/payments/recharge-products${lang ? `?lang=${lang}` : ''}`,
        {method: 'GET'}
    );
    return payload?.data ?? [];
}

/**
 * Create a recharge session (Stripe Hosted Checkout)
 */
export async function createRechargeSession(priceId: string, lang?: string): Promise<{ url: string }> {
    const payload = await fetchApi<{ status: string; url: string }>(
        '/payments/recharge',
        {method: 'POST', body: {priceId, lang}}
    );
    return {url: payload.url};
}

/**
 * Get user transactions
 */
export async function getTransactions(page = 1, limit = 10): Promise<{
    transactions: any[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    }
}> {
    const payload = await fetchApi<{ status: string; data: any }>(
        `/payments/transactions?page=${page}&limit=${limit}`,
        {method: 'GET'}
    );
    return payload?.data;
}

/**
 * Pay for a group with credits
 */
export async function payGroupWithCredits(groupId: string): Promise<{
    status: string;
    message: string;
    balance: number;
}> {
    return await fetchApi(
        `/payments/groups/${encodeURIComponent(groupId)}/pay-with-credits`,
        {method: 'POST'}
    );
}
