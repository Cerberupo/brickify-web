import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Button, Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui";
import {verifyAccount} from '@/lib/services/auth';
import {toast} from 'sonner';
import {APP_ROUTES} from '@/constants/routes';
import {navigate} from '@/lib/utils';

type VerifyPageProps = { initialSearch?: string };

export function VerifyPage({initialSearch}: VerifyPageProps) {
    const {t} = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        const verifyUserAccount = async () => {
            try {
                // Read email+code from a compact Base64 param `v` or fallback to legacy query params
                const search = initialSearch ? initialSearch : (typeof window !== 'undefined' ? window.location.search : '');
                const urlParams = new URLSearchParams(search || '');

                let emailParam: string | null = null;
                let codeParam: string | null = null;

                const packed = urlParams.get('v');
                if (packed) {
                    // Decode Base64 (support URL-safe variant) and parse JSON { email, code }
                    try {
                        // Convert URL-safe base64 to standard base64
                        const b64 = packed.replace(/-/g, '+').replace(/_/g, '/');
                        // Pad if necessary
                        const padded = b64 + '==='.slice((b64.length + 3) % 4);
                        const json = typeof atob !== 'undefined' ? atob(padded) : Buffer.from(padded, 'base64').toString('binary');

                        const obj = JSON.parse(json);
                        emailParam = typeof obj?.email === 'string' ? obj.email : null;
                        codeParam = typeof obj?.code === 'string' ? obj.code : null;
                    } catch (e) {
                        console.error('Failed to decode/parse v param', e);
                        setError(t('verify.missingParams', 'Missing email or verification code in URL.'));
                        setIsLoading(false);
                        return;
                    }
                } else {
                    // Legacy support: email & code as separate query params
                    emailParam = urlParams.get('email');
                    codeParam = urlParams.get('code');
                }

                // Check if both email and code are present
                if (!emailParam || !codeParam) {
                    setError(t('verify.missingParams', 'Missing email or verification code in URL.'));
                    setIsLoading(false);
                    return;
                }

                setEmail(emailParam);

                // Call the API to verify the account
                await verifyAccount(emailParam, codeParam);

                // If successful, set verified state
                setIsVerified(true);
                toast.success(t('verify.success', 'Your account has been verified successfully!'));

                // Redirect to login page after 3 seconds
                setTimeout(() => {
                    navigate(APP_ROUTES.LOGIN);
                }, 5000);
            } catch (error) {
                console.error('Verification error:', error);
                setError(
                    error instanceof Error
                        ? error.message
                        : t('verify.error', 'Failed to verify your account. The verification code may be invalid or expired.')
                );
            } finally {
                setIsLoading(false);
                // Clean verification params from URL to avoid re-processing on reload
                if (typeof window !== 'undefined') {
                    try {
                        const url = new URL(window.location.href);
                        url.searchParams.delete('v');
                        url.searchParams.delete('email');
                        url.searchParams.delete('code');
                        window.history.replaceState({}, document.title, url.pathname + (url.search ? '?' + url.searchParams.toString() : '') + url.hash);
                    } catch {
                    }
                }
            }
        };

        verifyUserAccount();
    }, [initialSearch, t]);

    return (
        <div className="grid place-items-center py-20 content-center">
            <Card className="w-[350px] mx-auto">
                <CardHeader>
                    <CardTitle>{t('verify.title', 'Account Verification')}</CardTitle>
                    <CardDescription>
                        {isLoading
                            ? t('verify.verifying', 'Verifying your account...')
                            : isVerified
                                ? t('verify.verified', 'Your account has been verified!')
                                : t('verify.failed', 'Verification failed')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : isVerified ? (
                        <div className="text-center">
                            <p className="mb-4">{t('verify.successMessage', 'Your account has been successfully verified. You will be redirected to the login page shortly.')}</p>
                            <Button onClick={() => navigate(APP_ROUTES.LOGIN)}>
                                {t('verify.login', 'Go to Login')}
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-red-500 mb-4">{error}</p>
                            {email && (
                                <p className="mb-4">
                                    {t('verify.tryAgain', 'Please try again or contact support if the problem persists.')}
                                </p>
                            )}
                            <Button onClick={() => navigate(APP_ROUTES.LOGIN)}>
                                {t('verify.backToLogin', 'Back to Login')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
