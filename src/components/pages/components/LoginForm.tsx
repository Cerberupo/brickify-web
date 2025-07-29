import React, {useState} from 'react';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {useTranslation} from 'react-i18next';


export function LoginForm() {
    const {t} = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would validate credentials here
        console.log('Login attempt with:', username, password);
        // Navigate to dashboard after successful login
        window.location.href = '/dashboard';
    };

    const handleGoogleLogin = () => {
        // In a real app, you would implement Google OAuth here
        console.log('Google login clicked');
        // Navigate to dashboard after successful login
        window.location.href = '/dashboard';
    };

    return (
        <Card className="w-[350px] mx-auto">
            <CardHeader>
                <CardTitle>{t('login')}</CardTitle>
                <CardDescription>{t('enterCredentials')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin}>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="username">{t('username')}</Label>
                            <Input
                                id="username"
                                placeholder={t('enterUsername')}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="password">{t('password')}</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={t('enterPassword')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                        <Button type="submit">{t('login')}</Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGoogleLogin}
                            className="flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                 strokeLinejoin="round" className="lucide lucide-chrome">
                                <circle cx="12" cy="12" r="10"/>
                                <circle cx="12" cy="12" r="4"/>
                                <line x1="21.17" x2="12" y1="8" y2="8"/>
                                <line x1="3.95" x2="8.54" y1="6.06" y2="14"/>
                                <line x1="10.88" x2="15.46" y1="21.94" y2="14"/>
                            </svg>
                            {t('loginWithGoogle')}
                        </Button>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">{t('noAccount')}</p>
            </CardFooter>
        </Card>
    );
}
