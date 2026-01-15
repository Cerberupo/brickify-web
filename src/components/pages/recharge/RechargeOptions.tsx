import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {createRechargeSession, getRechargeProducts} from '@/lib/services/stripe';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {ArrowRight, Building, Coins, Crown, Gem, Rocket, Sparkles, Trophy} from 'lucide-react';
import {toast} from 'sonner';
import {refundHref as makeRefundHref} from '@/lib/localeLinks';

const productIcons: Record<string, React.ReactNode> = {
    'prod_recharge_300': <Sparkles className="h-6 w-6 text-blue-400"/>,
    'prod_recharge_1100': <Rocket className="h-6 w-6 text-purple-400"/>,
    'prod_recharge_2000': <Gem className="h-6 w-6 text-emerald-400"/>,
    'prod_recharge_4600': <Trophy className="h-6 w-6 text-amber-400"/>,
    'prod_recharge_10000': <Crown className="h-6 w-6 text-yellow-500"/>,
    'prod_recharge_21600': <Building className="h-6 w-6 text-primary"/>,
};

const MOST_POPULAR_ID = 'prod_recharge_2000';

export function RechargeOptions() {
    const {t, i18n} = useTranslation();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [buyingId, setBuyingId] = useState<string | null>(null);

    useEffect(() => {
        loadProducts();
    }, [i18n.language]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const result = await getRechargeProducts(i18n.language);
            setProducts(result);
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error(t('recharge.error_loading', {defaultValue: 'Error loading products'}));
        } finally {
            setLoading(false);
        }
    };

    const handleRecharge = async (priceId: string) => {
        setBuyingId(priceId);
        try {
            const {url} = await createRechargeSession(priceId, i18n.language);
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error('Error creating recharge session:', error);
            toast.error(t('recharge.error_session', {defaultValue: 'Error starting payment'}));
            setBuyingId(null);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-20">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-4xl mx-auto text-center mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
                    {t('recharge.title', {defaultValue: 'Recharge your balance'})}
                </h1>
                <p className="text-xl text-muted-foreground">
                    {t('recharge.subtitle', {defaultValue: 'Choose a pack and get credits to spend on your creations.'})}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {products.map((product) => {
                    const isMostPopular = product.id === MOST_POPULAR_ID;
                    return (
                        <Card key={product.id}
                              className={`relative flex flex-col hover:border-primary transition-all duration-300 ${isMostPopular ? 'border-[#FFD700] ring-1 ring-[#FFD700] shadow-xl scale-105 z-10' : ''}`}>
                            {isMostPopular && (
                                <div
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap z-20">
                                    <span>🔥</span>
                                    <span>{t('recharge.mostPopular')}</span>
                                </div>
                            )}
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-2xl font-bold">
                                        {product.name}
                                    </CardTitle>
                                    {productIcons[product.id] || <Coins className="h-6 w-6 text-yellow-500"/>}
                                </div>
                                <CardDescription className="min-h-[40px]">
                                    {product.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="mt-4 flex items-center justify-center gap-3">
                                    <div className="flex items-baseline text-3xl font-bold">
                                        {product.amount / 100}
                                        <span className="ml-1 text-xl font-medium text-muted-foreground uppercase">
                                            {product.currency === 'usd' ? '$' : product.currency}
                                        </span>
                                    </div>
                                    <div
                                        className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                                        <span className="text-xl font-bold text-primary">{product.credits}</span>
                                        <Coins className="h-5 w-5 text-yellow-500"/>
                                    </div>
                                </div>
                                <ul className="mt-6 space-y-4 text-sm">
                                    <li className="flex items-center justify-center gap-1 text-muted-foreground pt-4 border-t border-gray-100">
                                        <span>{product.credits - product.bonus}</span>
                                        <Coins className="h-3 w-3 text-yellow-500/80"/>
                                        <span
                                            className={product.bonus > 0 ? "font-bold text-green-600" : "font-bold text-muted-foreground"}>
                                            +{product.bonus} extra
                                        </span>
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className={`w-full ${isMostPopular ? 'bg-black hover:bg-black/90' : ''}`}
                                    onClick={() => handleRecharge(product.priceId)}
                                    disabled={buyingId === product.priceId}
                                >
                                    {buyingId === product.priceId ? (
                                        <div
                                            className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : (
                                        <ArrowRight className="mr-2 h-4 w-4"/>
                                    )}
                                    {t('recharge.buy_now', {defaultValue: 'Buy now'})}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-8 text-center">
                <a
                    href={makeRefundHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline"
                >
                    {t('footer.refundPolicy')}
                </a>
            </div>

            {products.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">
                        {t('recharge.no_products', {defaultValue: 'No recharge products available at the moment.'})}
                    </p>
                </div>
            )}
        </div>
    );
}
