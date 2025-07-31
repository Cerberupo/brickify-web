import React from 'react';
import {useForm} from 'react-hook-form';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useTranslation} from 'react-i18next';
import {EmailField} from './EmailField';
import {PasswordField} from './PasswordField';
import {GoogleLogin} from '@react-oauth/google';
import {googleLoginRequest} from '@/lib/services/auth';


export function LoginForm() {
    const {t, i18n} = useTranslation();
    const {register, handleSubmit, formState: {errors}} = useForm({
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const handleLogin = (data: { email: string; password: string }) => {
        // In a real app, you would validate credentials here
        console.log('Login attempt with:', data);
        // Navigate to dashboard after successful login
        // window.location.href = '/dashboard';
    };

    const handleGoogleLoginSuccess = async (credentialResponse: any) => {
        // Validate the credential with the backend
        console.log('Google login success:', credentialResponse);

        try {
            const data = await googleLoginRequest(credentialResponse);
            console.log('Login response:', data);

            // Navigate to dashboard after successful login
            // window.location.href = '/dashboard';
        } catch (error) {
            console.error('Error during Google login:', error);
            // Handle error appropriately
        }
    };

    const handleGoogleLoginError = () => {
        console.error('Google login failed');
        // In a real app, you would show an error message to the user
    };

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
                        <Button type="submit">{t('login.login')}</Button>
                        <div className="flex justify-center">
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
                <p className="text-sm text-muted-foreground">
                    {t('login.noAccount')} <a href="/register"
                                              className="text-blue-500 hover:underline">{t('login.register')}</a>
                </p>
            </CardFooter>
        </Card>
    );
}
