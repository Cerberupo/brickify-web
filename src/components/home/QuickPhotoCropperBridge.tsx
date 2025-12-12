import React, {useEffect, useMemo, useState} from 'react';
import {ImageCropperDialog} from '@/components/image/ImageCropperDialog';
// Asegura que i18next esté inicializado en este island React
import '@/lib/i18n';
import {I18nProvider} from '@/lib';

type OpenDetail = { src: string; token: string };

/**
 * Bridge component: listens to window event "open-quick-cropper"
 * and opens the React cropper dialog. It emits:
 *  - quick-cropper-opened { token }
 *  - quick-cropper-confirmed { token, previewUrl, dataUrl }
 *  - quick-cropper-closed { token }
 */
const QuickPhotoCropperBridge: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [src, setSrc] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    // stable memoized handlers
    const handleClose = useMemo(() => () => {
        const t = token;
        setOpen(false);
        setSrc(null);
        setToken(null);
        // Notify close
        window.dispatchEvent(new CustomEvent('quick-cropper-closed', {detail: {token: t || ''}}));
    }, [token]);

    useEffect(() => {
        const onOpen = (e: Event) => {
            const detail = (e as CustomEvent<OpenDetail>).detail;
            if (!detail) return;
            const {src: s, token: tk} = detail;
            setSrc(s);
            setToken(tk);
            setOpen(true);
            // Let the host know the dialog is open for this token
            window.dispatchEvent(new CustomEvent('quick-cropper-opened', {detail: {token: tk}}));
        };
        window.addEventListener('open-quick-cropper', onOpen as EventListener);
        return () => {
            window.removeEventListener('open-quick-cropper', onOpen as EventListener);
        };
    }, []);

    const handleConfirm = async (file: File, previewUrl: string) => {
        // Convert to data URL for backend submission convenience
        const dataUrl: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('read_error'));
            reader.readAsDataURL(file);
        });

        const tk = token || '';
        window.dispatchEvent(new CustomEvent('quick-cropper-confirmed', {
            detail: {token: tk, previewUrl, dataUrl}
        }));
        // Close afterward
        handleClose();
    };

    return (
        <I18nProvider>
            <ImageCropperDialog
                open={open}
                src={src}
                onClose={handleClose}
                onConfirm={handleConfirm}
            />
        </I18nProvider>
    );
};

export default QuickPhotoCropperBridge;
