import React, {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {loadStripe} from '@stripe/stripe-js';
import {EmbeddedCheckout, EmbeddedCheckoutProvider} from '@stripe/react-stripe-js';
import {STRIPE_PUBLISHABLE_KEY} from '@/config';
import {createGroupCheckoutSession, payGroupWithCredits} from '@/lib/services/stripe';
import {useAuth} from '@/lib/hooks/useAuth';
import {getGroupById} from '@/lib/services/groups';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {AlertCircle, CheckCircle2, Coins} from 'lucide-react';
import {navigate} from '@/lib/utils';
import {localizePath, refundHref as makeRefundHref} from '@/lib/localeLinks';
import {toast} from 'sonner';
import {setUser as setUserStore} from '@/lib/stores/authStore';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

function getGroupId() {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('groupId');
    if (!groupId) {
        return null;
    }
    return groupId;
}

export default function CheckoutPage() {
    const {t} = useTranslation();
    const {user} = useAuth();
    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [success, setSuccess] = useState(false);

    const groupId = getGroupId();

    useEffect(() => {
        if (groupId && user) {
            loadGroup();
        } else {
            setLoading(false);
        }
    }, [groupId, user]);

    const loadGroup = async () => {
        if (!groupId) return;
        try {
            const data = await getGroupById(groupId);
            setGroup(data);
        } catch (error) {
            console.error('Error loading group:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayWithCredits = async () => {
        if (!groupId) return;
        setPaying(true);
        try {
            const result = await payGroupWithCredits(groupId);
            if (result.status === 'success') {
                setSuccess(true);
                toast.success(t('checkout.payment_success', {defaultValue: 'Payment successful!'}));
                // Update user balance in store
                if (user) {
                    setUserStore({...user, balance: result.balance} as any);
                }
                setTimeout(() => {
                    navigate(localizePath(`/group?id=${groupId}`));
                }, 2000);
            } else {
                toast.error(result.message || t('checkout.payment_error', {defaultValue: 'Payment failed'}));
            }
        } catch (error: any) {
            console.error('Error paying with credits:', error);
            toast.error(error.message || t('checkout.payment_error', {defaultValue: 'Payment failed'}));
        } finally {
            setPaying(false);
        }
    };

    const fetchClientSecret = useCallback(async () => {
        // This is now only for guests or if the new flow is not applicable
        try {
            const gid = getGroupId();
            if (!gid) throw new Error('Missing groupId');
            const {clientSecret} = await createGroupCheckoutSession(gid, `${window.location.origin}/checkout/return/`);
            return clientSecret;
        } catch {
            // fallback
        }

        try {
            const raw = sessionStorage.getItem('guestCheckout');
            if (raw) {
                const parsed = JSON.parse(raw || '{}');
                if (parsed && parsed.clientSecret) {
                    sessionStorage.removeItem('guestCheckout');
                    return parsed.clientSecret as string;
                }
            }
        } catch (_) {
        }

        throw new Error('Missing checkout context');
    }, []);

    const options = {
        fetchClientSecret,
    } as any;

    if (loading) {
        return (
            <div className="container mx-auto py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // New Credit Flow for Authenticated Users
    if (user && group) {
        // Derive total members (persons) from referencePeople (sum individuals and people inside groups)
        let totalMembers = 0;
        const entries = group.referencePeople || [];
        for (const e of entries) {
            if (!e) continue;
            if (e.type === 'person') {
                totalMembers += 1;
            } else if (e.type === 'group') {
                const ppl = Array.isArray(e.people) ? e.people.length : 0;
                totalMembers += ppl;
            }
        }

        const costPerPerson = 100; // Match backend
        const totalCost = totalMembers * costPerPerson;
        const hasEnoughBalance = (user as any).balance >= totalCost;

        if (success) {
            return (
                <section className="container mx-auto p-4 py-20 flex justify-center">
                    <Card className="max-w-md w-full text-center">
                        <CardHeader>
                            <div className="flex justify-center mb-4">
                                <CheckCircle2 className="h-16 w-16 text-green-500"/>
                            </div>
                            <CardTitle
                                className="text-2xl font-bold">{t('checkout.success_title', {defaultValue: 'Payment Successful'})}</CardTitle>
                            <CardDescription>
                                {t('checkout.success_description', {defaultValue: 'Your group is being processed. You will be redirected shortly.'})}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </section>
            );
        }

        return (
            <section className="container mx-auto p-4 py-10 flex justify-center">
                <Card className="max-w-lg w-full">
                    <CardHeader>
                        <CardTitle
                            className="text-2xl font-bold">{t('checkout.confirm_title', {defaultValue: 'Confirm Payment'})}</CardTitle>
                        <CardDescription>
                            {t('checkout.confirm_subtitle', {defaultValue: 'Review the details before processing the payment with your credits.'})}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span>{t('checkout.group_name', {defaultValue: 'Group'})}:</span>
                                <span className="font-semibold">{group.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('checkout.persons_count', {defaultValue: 'Number of photos'})}:</span>
                                <span className="font-semibold">{totalMembers}</span>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
                                <span>{t('checkout.total_cost', {defaultValue: 'Total Cost'})}:</span>
                                <div className="flex items-center">
                                    <Coins className="h-5 w-5 mr-1 text-yellow-500"/>
                                    <span>{totalCost}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-4 border rounded-lg">
                            <div className="flex flex-col">
                                <span
                                    className="text-sm text-muted-foreground">{t('checkout.your_balance', {defaultValue: 'Your Balance'})}</span>
                                <div className="flex items-center font-bold text-lg">
                                    <Coins className="h-5 w-5 mr-1 text-yellow-500"/>
                                    <span>{(user as any).balance || 0}</span>
                                </div>
                            </div>
                            {!hasEnoughBalance && (
                                <div className="flex items-center text-red-500 text-sm font-medium">
                                    <AlertCircle className="h-4 w-4 mr-1"/>
                                    {t('checkout.insufficient_balance', {defaultValue: 'Insufficient balance'})}
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-3">
                        {hasEnoughBalance ? (
                            <Button
                                className="w-full text-lg h-12"
                                onClick={handlePayWithCredits}
                                disabled={paying}
                            >
                                {paying && <div
                                    className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                                {t('checkout.pay_now', {defaultValue: 'Pay with Credits'})}
                            </Button>
                        ) : (
                            <Button
                                className="w-full text-lg h-12"
                                variant="outline"
                                onClick={() => navigate(localizePath('/recharge'))}
                            >
                                {t('checkout.go_to_recharge', {defaultValue: 'Recharge Credits'})}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => navigate(localizePath(`/group?id=${groupId}`))}
                            disabled={paying}
                        >
                            {t('common.cancel', {defaultValue: 'Cancel'})}
                        </Button>
                        <div className="text-center">
                            <a
                                href={makeRefundHref()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-muted-foreground hover:underline"
                            >
                                {t('footer.refundPolicy')}
                            </a>
                        </div>
                    </CardFooter>
                </Card>
            </section>
        );
    }

    // Guest Flow or Error State
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
