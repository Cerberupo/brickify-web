import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui";
import {useTranslation} from 'react-i18next';
import {EmailField, NameField, PasswordField} from "@/components/inputFields";
import {register as registerUser} from '@/lib/services/auth';
import {toast} from 'sonner';
import {APP_ROUTES} from '@/constants/routes';
import {navigate} from '@/lib/utils';
import {loginHref as makeLoginHref} from '@/lib/localeLinks';

export function RegisterForm({redirect}: { redirect?: string }) {
    const {t, i18n} = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const {register, handleSubmit, formState: {errors}} = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: ''
        }
    });

    const handleRegister = async (data: { name: string; email: string; password: string }) => {
        setIsLoading(true);
        try {
            await registerUser(data.name, data.email, data.password, i18n.language);
            // Señalamos a la página de login que debe mostrar el aviso de verificación por email
            let loginUrl = `${makeLoginHref()}?checkEmail=1`;
            if (redirect) {
                loginUrl += `&redirect=${encodeURIComponent(redirect)}`;
            }
            navigate(loginUrl);
        } catch (error) {
            console.error('Registration error:', error);
            const userMsg = (error as any)?.translatedMessage
                || (error instanceof Error ? error.message : t('register.errorMessage', 'Registration failed. Please try again.'));
            toast.error(userMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-[350px] mx-auto">
            <CardHeader>
                <CardTitle>{t('register.register')}</CardTitle>
                <CardDescription>{t('register.createAccount')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(handleRegister)}>
                    <div className="grid w-full items-center gap-4">
                        <NameField register={register} errors={errors}/>
                        <EmailField register={register} errors={errors}/>
                        <PasswordField register={register} errors={errors}/>
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                        <Button type="submit" isLoading={isLoading}>
                            {isLoading ? t('register.registering', 'Registering...') : t('register.register')}
                        </Button>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    {t('register.alreadyHaveAccount')} <a href={APP_ROUTES.LOGIN}
                                                          className="text-blue-500 hover:underline">{t('register.login')}</a>
                </p>
            </CardFooter>
        </Card>
    );
}
