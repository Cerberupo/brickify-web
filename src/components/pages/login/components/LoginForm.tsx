import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui";
import {useTranslation} from 'react-i18next';
import {GoogleLogin} from '@react-oauth/google';
import {googleLoginRequest, login} from '@/lib';
import {APP_ROUTES} from '@/constants/routes';
import {EmailField, PasswordField} from "@/components/inputFields";
import {toast} from 'sonner';
import {navigate} from '@/lib/utils';
import { localizePath } from '@/lib/localeLinks';


export function LoginForm() {
    const {t, i18n} = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const {register, handleSubmit, formState: {errors}} = useForm({
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const handleLogin = async (data: { email: string; password: string }) => {
        setIsLoading(true);
        try {
            console.log('Login attempt with:', data);
            const response = await login(data.email, data.password);
            console.log('Login response:', response);

            toast.success(t('login.successMessage', 'Login successful!'));
            // Navigate to dashboard after successful login
            navigate(APP_ROUTES.DASHBOARD);
        } catch (error) {
            console.error('Error during login:', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('login.errorMessage', 'Login failed. Please try again.')
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLoginSuccess = async (credentialResponse: any) => {
        // Validate the credential with the backend
        console.log('Google login success:', credentialResponse);
        setIsLoading(true);

        try {
            const data = await googleLoginRequest(credentialResponse, i18n.language);
            console.log('Login response:', data);

            toast.success(t('login.successMessage', 'Login successful!'));
            // Navigate to dashboard after successful login
            navigate(APP_ROUTES.DASHBOARD);
        } catch (error) {
            console.error('Error during Google login:', error);
            const code = (error as any)?.code;
            if (code === 'USE_EMAIL_PASSWORD_LOGIN') {
                toast.error(t('login.useEmailPasswordError', 'Este usuario está registrado con email y contraseña. Inicia sesión con tu email y contraseña.'));
            } else if (code === 'USE_GOOGLE_LOGIN') {
                toast.error(t('login.useGoogleLoginError', 'Esta cuenta usa Google para iniciar sesión. Por favor, inicia sesión con Google.'));
            } else {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : t('login.googleErrorMessage', 'Google login failed. Please try again.')
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLoginError = () => {
        console.error('Google login failed');
        toast.error(t('login.googleErrorMessage', 'Google login failed. Please try again.'));
    };

    console.log('i18n.language:', i18n.language);

    return (
        <Card className="w-[350px] mx-auto">
            <CardHeader>
                <CardTitle>{t('login.login')}</CardTitle>
                <CardDescription>{t('login.enterCredentials')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(handleLogin)}>
                    <div className="grid w-full items-center gap-4">
                        <EmailField register={register} errors={errors}/>
                        <PasswordField register={register} errors={errors}/>
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                        <Button type="submit" isLoading={isLoading}>
                            {isLoading ? t('login.loggingIn', 'Logging in...') : t('login.login')}
                        </Button>
                        <div className={`flex justify-center ${isLoading ? 'pointer-events-none' : ''}`}>
                            <GoogleLogin
                                width="300px"
                                onSuccess={handleGoogleLoginSuccess}
                                onError={handleGoogleLoginError}
                                text="signin_with"
                                shape="pill"
                                locale={i18n.language}
                                theme="outline"
                                logo_alignment="left"
                            />
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                    <a href={localizePath('/recover/')}
                       className="text-blue-500 hover:underline">{t('login.forgotPassword', 'Forgot your password?')}</a>
                    <p>
                        {t('login.noAccount')} <a href={APP_ROUTES.REGISTER}
                                                  className="text-blue-500 hover:underline">{t('login.register')}</a>
                    </p>
                </div>
            </CardFooter>
        </Card>
    );
}
