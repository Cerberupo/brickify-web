import React, {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Toaster} from '@/components/ui';
import {PasswordField} from '@/components/inputFields';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {toast} from 'sonner';
import {resetPassword} from '@/lib/services/auth';
import {homeHref as makeHomeHref, loginHref as makeLoginHref} from '@/lib/localeLinks';
import {navigate} from '@/lib/utils';
import {PROJECT_NAME} from '@/config';

type ResetPageProps = { initialSearch?: string };

type FormValues = {
    password: string;
    confirmPassword: string;
}

export function ResetPasswordPage({initialSearch}: ResetPageProps) {
    const {t} = useTranslation();
    const [email, setEmail] = useState<string | null>(null);
    const [code, setCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [paramsError, setParamsError] = useState<string | null>(null);

    const {register, handleSubmit, formState: {errors}, getValues} = useForm<FormValues>({
        defaultValues: {password: '', confirmPassword: ''}
    });

    // Decode base64 param `v` containing { email, code }
    useEffect(() => {
        const search = initialSearch ? initialSearch : (typeof window !== 'undefined' ? window.location.search : '');
        const urlParams = new URLSearchParams(search || '');
        const packed = urlParams.get('v');

        let emailParam: string | null = null;
        let codeParam: string | null = null;

        if (packed) {
            try {
                const b64 = packed.replace(/-/g, '+').replace(/_/g, '/');
                const padded = b64 + '==='.slice((b64.length + 3) % 4);
                const json = typeof atob !== 'undefined' ? atob(padded) : Buffer.from(padded, 'base64').toString('binary');
                const obj = JSON.parse(json);
                emailParam = typeof obj?.email === 'string' ? obj.email : null;
                codeParam = typeof obj?.code === 'string' ? obj.code : null;
            } catch (e) {
                console.error('Failed to decode/parse v param for reset', e);
                setParamsError(t('reset.missingParams', 'Missing email or reset code in URL.'));
                return;
            }
        }

        if (!emailParam || !codeParam) {
            setParamsError(t('reset.missingParams', 'Missing email or reset code in URL.'));
            return;
        }

        setEmail(emailParam);
        setCode(codeParam);
    }, [initialSearch, t]);

    const onSubmit = async (data: FormValues) => {
        if (!email || !code) return;
        setLoading(true);
        try {
            await resetPassword(email, code, data.password);
            // Clean query param to avoid leaking sensitive code on reload
            if (typeof window !== 'undefined') {
                try {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('v');
                    window.history.replaceState({}, document.title, url.pathname + (url.search ? '?' + url.searchParams.toString() : '') + url.hash);
                } catch {
                }
            }
            // Redirect to login indicating reset success so the toast is shown there
            setTimeout(() => {
                const loginUrl = `${makeLoginHref()}?resetSuccess=1`;
                navigate(loginUrl);
            }, 300);
        } catch (error) {
            console.error('Reset password error:', error);
            const userMsg = (error as any)?.translatedMessage
                || (error instanceof Error ? error.message : t('reset.errorMessage', 'We could not reset your password. The code might be invalid or expired.'));
            toast.error(userMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid place-items-center py-20 content-center">
            <Toaster position="top-right"/>
            <a href={makeHomeHref()} className="mb-8 inline-flex items-center gap-2">
                <img src="/logo.svg" alt={PROJECT_NAME} className="h-10 w-auto"/>
                <span className="sr-only">{PROJECT_NAME}</span>
            </a>
            <Card className="w-[350px] mx-auto">
                <CardHeader>
                    <CardTitle>{t('reset.title', 'Create a new password')}</CardTitle>
                    <CardDescription>
                        {t('reset.description', 'Choose a new password to regain access to your account.')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {paramsError ? (
                        <div className="text-center">
                            <p className="text-red-500 mb-4">{paramsError}</p>
                            <Button
                                onClick={() => navigate(makeLoginHref())}>{t('reset.backToLogin', 'Back to login')}</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid w-full items-center gap-4">
                                {/* New password field with same validations as registration */}
                                <PasswordField register={register} errors={errors}/>

                                {/* Confirm password */}
                                <div className="flex flex-col space-y-1.5">
                                    <Label
                                        htmlFor="confirmPassword">{t('reset.confirmPasswordLabel', 'Confirm password')}</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder={t('reset.confirmPasswordPlaceholder', 'Re-enter your new password')}
                                        aria-invalid={errors?.confirmPassword ? true : undefined}
                                        {...register('confirmPassword', {
                                            required: t('reset.confirmPasswordRequired', 'Please confirm your password') as any,
                                            validate: (value: string) => value === getValues('password') || (t('reset.passwordMismatch', 'Passwords do not match') as any)
                                        })}
                                    />
                                    {errors?.confirmPassword && (
                                        <p className="text-sm text-red-500">{String(errors.confirmPassword.message)}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 mt-4">
                                <Button type="submit" isLoading={loading}>
                                    {loading ? t('reset.saving', 'Saving...') : t('reset.submit', 'Set new password')}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        <a href={makeLoginHref()} className="text-blue-500 hover:underline">
                            {t('reset.backToLogin', 'Back to login')}
                        </a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default ResetPasswordPage;
