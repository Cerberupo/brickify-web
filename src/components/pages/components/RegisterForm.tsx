import React from 'react';
import {useForm} from 'react-hook-form';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useTranslation} from 'react-i18next';
import {EmailField} from './EmailField';
import {PasswordField} from './PasswordField';
import {NameField} from './NameField';

export function RegisterForm() {
    const {t} = useTranslation();
    const {register, handleSubmit, formState: {errors}} = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: ''
        }
    });

    const handleRegister = (data: { name: string; email: string; password: string }) => {
        // In a real app, you would register the user here
        console.log('Registration attempt with:', data);
        // Navigate to login after successful registration
        window.location.href = '/login';
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
                        <NameField register={register} errors={errors} />
                        <EmailField register={register} errors={errors} />
                        <PasswordField register={register} errors={errors} />
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                        <Button type="submit">{t('register.register')}</Button>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    {t('register.alreadyHaveAccount')} <a href="/login" className="text-blue-500 hover:underline">{t('register.login')}</a>
                </p>
            </CardFooter>
        </Card>
    );
}
