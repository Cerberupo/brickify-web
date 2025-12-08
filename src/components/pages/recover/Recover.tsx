import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Toaster} from '@/components/ui';
import {EmailField} from '@/components/inputFields';
import {toast} from 'sonner';
import {requestPasswordReset} from '@/lib/services/auth';
import {homeHref as makeHomeHref, loginHref as makeLoginHref} from '@/lib/localeLinks';
import {PROJECT_NAME} from '@/config';

export function RecoverPasswordPage() {
    const {t, i18n} = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const {register, handleSubmit, formState: {errors}} = useForm({
        defaultValues: {
            email: ''
        }
    });

    const onSubmit = async (data: { email: string }) => {
        setIsLoading(true);
        try {
            await requestPasswordReset(data.email, i18n.language);
            toast.success(t('recover.successMessage', 'If an account exists for this email, we have sent a password reset link.'));
        } catch (error) {
            console.error('Password reset request error:', error);
            const userMsg = (error as any)?.translatedMessage
                || (error instanceof Error ? error.message : t('recover.errorMessage', 'We could not process your request. Please try again later.'));
            toast.error(userMsg);
        } finally {
            setIsLoading(false);
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
                    <CardTitle>{t('recover.title', 'Recover password')}</CardTitle>
                    <CardDescription>
                        {t('recover.description', 'Enter your email and we will send you instructions to reset your password.')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid w-full items-center gap-4">
                            <EmailField register={register} errors={errors}/>
                        </div>
                        <div className="flex flex-col gap-2 mt-4">
                            <Button type="submit" isLoading={isLoading}>
                                {isLoading ? t('recover.sending', 'Sending...') : t('recover.submit', 'Send reset link')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        <a href={makeLoginHref()} className="text-blue-500 hover:underline">
                            {t('recover.backToLogin', 'Back to login')}
                        </a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default RecoverPasswordPage;
