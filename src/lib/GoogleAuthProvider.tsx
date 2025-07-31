import React from 'react';
import {GoogleOAuthProvider} from '@react-oauth/google';
import {GOOGLE_CLIENT_ID} from "@/config.ts";

export function GoogleAuthProvider({children}: { children: React.ReactNode }) {
    console.log('GoogleAuthProvider');
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            {children}
        </GoogleOAuthProvider>
    );
}