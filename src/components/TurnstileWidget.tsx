import React, { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
    onVerify: (token: string) => void;
    onExpire?: () => void;
    onError?: (error: any) => void;
}

declare global {
    interface Window {
        turnstile?: {
            render: (
                container: HTMLElement | string,
                options: {
                    sitekey: string;
                    callback: (token: string) => void;
                    'expired-callback'?: () => void;
                    'error-callback'?: (error: any) => void;
                    theme?: 'light' | 'dark' | 'auto';
                }
            ) => string;
            reset: (widgetId?: string) => void;
            remove: (widgetId?: string) => void;
        };
        onloadTurnstileCallback?: () => void;
    }
}

export function TurnstileWidget({ onVerify, onExpire, onError }: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    // Site key provided by Cloudflare dashboard
    const siteKey = (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_TURNSTILE_SITE_KEY)
        || (typeof process !== 'undefined' && process.env?.PUBLIC_TURNSTILE_SITE_KEY)
        || '0x4AAAAAAEFg4oQVL_JDuYjS';

    useEffect(() => {
        if (!siteKey) return;

        let isMounted = true;

        const renderWidget = () => {
            if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;
            try {
                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    action: 'turnstile-spin-v2',
                    callback: (token: string) => {
                        if (isMounted) onVerify(token);
                    },
                    'expired-callback': () => {
                        if (isMounted && onExpire) onExpire();
                    },
                    'error-callback': (err: any) => {
                        if (isMounted && onError) onError(err);
                    },
                    theme: 'auto'
                });
            } catch (err) {
                console.error('[TurnstileWidget] Error rendering widget:', err);
            }
        };

        // Check if script is already injected
        const existingScript = document.getElementById('cf-turnstile-script');

        if (window.turnstile) {
            renderWidget();
        } else if (!existingScript) {
            window.onloadTurnstileCallback = () => {
                if (isMounted) renderWidget();
            };
            const script = document.createElement('script');
            script.id = 'cf-turnstile-script';
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        } else {
            const prevCallback = window.onloadTurnstileCallback;
            window.onloadTurnstileCallback = () => {
                if (prevCallback) prevCallback();
                if (isMounted) renderWidget();
            };
        }

        return () => {
            isMounted = false;
            if (widgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch (_) {}
                widgetIdRef.current = null;
            }
        };
    }, [siteKey, onVerify, onExpire, onError]);

    return (
        <div
            ref={containerRef}
            className="cf-turnstile my-2 flex justify-center"
            data-sitekey={siteKey}
            data-action="turnstile-spin-v2"
        />
    );
}
