import React, {useEffect, useMemo, useRef, useState} from 'react';
import LegoPreviewCard from '@/components/home/LegoPreviewCard';
import {getPublicSharedMember, type PublicSharedMember} from "@/lib/services/public.ts";
import {useTranslation} from "react-i18next";

export type PublicShareViewProps = {
    locale?: 'en' | 'es';
};

export function PublicShareView({locale = 'en'}: PublicShareViewProps) {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [member, setMember] = useState<PublicSharedMember | null>(null);

    const params = useMemo(() => {
        if (typeof window === 'undefined') return {g: '', m: ''};
        const sp = new URLSearchParams(window.location.search);
        return {
            groupShareId: sp.get('groupShareId') || sp.get('group_id') || sp.get('g') || '',
            memberShareId: sp.get('memberShareId') || sp.get('member_id') || sp.get('m') || '',
        };
    }, []);

    const fetchedKeyRef = useRef<string | null>(null);

    useEffect(() => {
        const g = params.groupShareId;
        const m = params.memberShareId;
        const key = `${g}|${m}`;

        if (!g || !m) {
            // Missing params: set error once
            if (fetchedKeyRef.current !== key) {
                fetchedKeyRef.current = key;
                setError(t('publicShare.missingParams', 'Faltan parámetros en la URL.'));
                setLoading(false);
            }
            return;
        }

        if (fetchedKeyRef.current === key) {
            // Already fetched for this pair, avoid refetch loops
            return;
        }
        fetchedKeyRef.current = key;

        (async () => {
            try {
                const data = await getPublicSharedMember(g, m);
                if (!data) {
                    setError(t('publicShare.notFound', 'No se encontró el contenido compartido.'));
                } else {
                    setMember(data);
                    setError(null);
                }
            } catch (e) {
                setError(t('publicShare.error', 'No se pudo cargar el contenido.'));
            } finally {
                setLoading(false);
            }
        })();
    }, [params.groupShareId, params.memberShareId]);

    return (
        <section className="relative min-h-screen flex items-center justify-center">
            <div className="absolute inset-0 -z-10 bg-[#F1EEFF]" aria-hidden="true"></div>
            <div
                className="container mx-auto px-4 md:px-6 pt-8 pb-16 md:pt-16 md:pb-24 relative flex flex-col items-center">

                {member ? <>
                    <h2 id="how-title"
                        className="text-3xl text-center md:text-[32px] font-medium tracking-tight mb-12 md:mb-8">
                        {t('share.piecesOf', {name: member.name})}
                    </h2>
                    <LegoPreviewCard locale={locale} shared={true} referencePerson={member}/>
                </> : null}

            </div>
        </section>
    );
}

export default PublicShareView;
