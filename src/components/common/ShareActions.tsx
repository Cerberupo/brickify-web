import React, {useCallback, useEffect, useState} from 'react';
import {Button, Switch} from '@/components/ui';
import {Link as LinkIcon, Share2} from 'lucide-react';
import {toast} from 'sonner';
import {disableMemberShare, enableMemberShare} from '@/lib/services/groups';

export type ShareActionsProps = {
    groupId: string;
    personId: string;
    groupShareId?: string | null;
    personShareId?: string | null;
    initialEnabled?: boolean;
    locale?: 'es' | 'en';
    /** If present, will be forwarded to backend enable call and appended to public URL */
    guestKey?: string | null;
    /** Notify parent when enabled flag toggles or share ids change */
    onEnabledChange?: (enabled: boolean, ids?: { groupShareId?: string; personShareId?: string }) => void;
};

export function ShareActions({
                                 groupId,
                                 personId,
                                 groupShareId,
                                 personShareId,
                                 initialEnabled = false,
                                 locale = 'es',
                                 guestKey,
                                 onEnabledChange,
                             }: ShareActionsProps) {
    const [enabled, setEnabled] = useState<boolean>(!!initialEnabled);
    const [loading, setLoading] = useState(false);
    const [ids, setIds] = useState<{ groupShareId?: string; personShareId?: string }>({
        groupShareId: groupShareId || undefined,
        personShareId: personShareId || undefined,
    });

    useEffect(() => {
        setEnabled(!!initialEnabled);
    }, [initialEnabled]);

    useEffect(() => {
        setIds({groupShareId: groupShareId || undefined, personShareId: personShareId || undefined});
    }, [groupShareId, personShareId]);

    const buildShareData = useCallback(() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        let url = `${origin}/share?g=${encodeURIComponent(ids.groupShareId || '')}&m=${encodeURIComponent(ids.personShareId || '')}`;
        const text = locale === 'es'
            ? '¡Mira las piezas LEGO que coinciden con mi imagen en Brickify! @BrickifyFun'
            : 'Check out these LEGO pieces that match my image on Brickify! @BrickifyFun';
        return {url, text};
    }, [ids.groupShareId, ids.personShareId]);

    const doEnable = useCallback(async () => {
        if (enabled || loading) return;
        setLoading(true);
        try {
            const res = await enableMemberShare(groupId, personId, guestKey || undefined);
            setIds({groupShareId: res.groupShareId, personShareId: res.personShareId});
            setEnabled(true);
            onEnabledChange && onEnabledChange(true, res);
        } catch (e) {
            toast.error(locale === 'es' ? 'No se pudo activar el enlace para compartir.' : 'Failed to enable share link.');
        } finally {
            setLoading(false);
        }
    }, [enabled, loading, groupId, personId, guestKey, onEnabledChange, locale]);

    const doDisable = useCallback(async () => {
        if (!enabled || loading) return;
        setLoading(true);
        try {
            await disableMemberShare(groupId, personId, guestKey || undefined);
            setEnabled(false);
            onEnabledChange && onEnabledChange(false, ids);
        } catch (e) {
            toast.error(locale === 'es' ? 'No se pudo desactivar el compartir.' : 'Failed to disable sharing.');
        } finally {
            setLoading(false);
        }
    }, [enabled, loading, groupId, personId, ids, onEnabledChange, locale, guestKey]);

    const handleShareX = useCallback(() => {
        const {url, text} = buildShareData();
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }, [buildShareData]);

    const handleShareFacebook = useCallback(() => {
        const {url} = buildShareData();
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }, [buildShareData]);

    const handleShareWhatsApp = useCallback(() => {
        const {url, text} = buildShareData();
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }, [buildShareData]);

    const handleCopyLink = useCallback(async () => {
        const {url} = buildShareData();
        try {
            await navigator.clipboard.writeText(url);
            toast.success(locale === 'es' ? 'Enlace copiado al portapapeles' : 'Link copied to clipboard');
        } catch {
            const ta = document.createElement('textarea');
            ta.value = url;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                toast.success(locale === 'es' ? 'Enlace copiado al portapapeles' : 'Link copied to clipboard');
            } finally {
                document.body.removeChild(ta);
            }
        }
    }, [buildShareData, locale]);

    if (!enabled) {
        return (
            <Button onClick={doEnable} disabled={loading}
                    title={locale === 'es' ? 'Activar compartir' : 'Enable sharing'}
                    className="transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 active:translate-y-0 active:scale-95">
                <Share2 className="h-4 w-4 mr-1"/>
                {loading ? (locale === 'es' ? 'Activando…' : 'Enabling…') : (locale === 'es' ? 'Compartir' : 'Share')}
            </Button>
        );
    }

    return (
        <>
            <div className="flex gap-2 items-center">
                <Button variant="ghost" size="icon"
                        className="h-8 w-8 rounded-full transition duration-200 ease-out hover:bg-neutral-100 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 active:translate-y-0 active:scale-95"
                        onClick={handleShareX}
                        title={locale === 'es' ? 'Compartir en X/Twitter' : 'Share on X/Twitter'}>
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>X</title>
                        <path
                            d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/>
                    </svg>
                    <span className="sr-only">X</span>
                </Button>
                <Button variant="ghost" size="icon"
                        className="h-8 w-8 rounded-full transition duration-200 ease-out hover:bg-neutral-100 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 active:translate-y-0 active:scale-95"
                        onClick={handleShareFacebook}
                        title={locale === 'es' ? 'Compartir en Facebook' : 'Share on Facebook'}>
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Facebook</title>
                        <path
                            d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
                    </svg>
                    <span className="sr-only">Facebook</span>
                </Button>
                <Button variant="ghost" size="icon"
                        className="h-8 w-8 rounded-full transition duration-200 ease-out hover:bg-neutral-100 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 active:translate-y-0 active:scale-95"
                        onClick={handleShareWhatsApp}
                        title={locale === 'es' ? 'Compartir en WhatsApp' : 'Share on WhatsApp'}>
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>WhatsApp</title>
                        <path
                            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="sr-only">WhatsApp</span>
                </Button>
                <Button variant="ghost" size="icon"
                        className="h-8 w-8 rounded-full transition duration-200 ease-out hover:bg-neutral-100 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 active:translate-y-0 active:scale-95"
                        onClick={handleCopyLink}
                        title={locale === 'es' ? 'Copiar enlace' : 'Copy link'}>
                    <LinkIcon className="h-4 w-4"/>
                    <span className="sr-only">{locale === 'es' ? 'Copiar enlace' : 'Copy link'}</span>
                </Button>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l">
                <Switch id={`share-toggle-${personId}`}
                        checked={enabled}
                        onCheckedChange={(v) => v ? doEnable() : doDisable()}
                        disabled={loading}
                />
                <label htmlFor={`share-toggle-${personId}`} className="text-sm text-gray-700">
                    {loading ? (locale === 'es' ? 'Desactivando…' : 'Disabling…') : (locale === 'es' ? 'Desactivar compartir' : 'Disable sharing')}
                </label>
            </div>
        </>
    );
}

export default ShareActions;
