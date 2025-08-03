import React, {type ReactNode} from 'react';
import {useAuth} from '@/lib';
import {LoadingScreen} from '@/components/ui';

interface LoadingProviderProps {
    children: ReactNode;
}

export function LoadingProvider({children}: LoadingProviderProps) {
    const {isLoading} = useAuth();

    if (isLoading) {
        return <LoadingScreen/>;
    }

    return <>{children}</>;
}