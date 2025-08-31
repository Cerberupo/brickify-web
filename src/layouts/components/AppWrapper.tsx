import React, {type ReactNode} from 'react';
import {Header} from './Header';
import {Footer} from './Footer';
import {AuthProvider, I18nProvider} from '@/lib';
import {LoadingProvider} from '@/components/providers';

interface AppWrapperProps {
    children: ReactNode;
    hideHeader?: boolean;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({children, hideHeader}) => {
    return (
        <AuthProvider>
            <I18nProvider>
                <LoadingProvider>
                    {hideHeader ? null : <Header/>}
                    <main className="flex-1">
                        {children}
                    </main>
                    <Footer/>
                </LoadingProvider>
            </I18nProvider>
        </AuthProvider>
    );
};
