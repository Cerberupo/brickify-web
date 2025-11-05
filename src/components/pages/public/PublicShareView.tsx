import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {getPublicSharedMember, type PublicSharedMember} from '@/lib/services/public';
import favicon from '@/images/favicon.png';
import {PROJECT_NAME} from '@/config';

const faviconUrl: string = typeof favicon === 'string' ? favicon : (favicon as any).src;

export function PublicShareView() {
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

    const imageSrc = member?.imageSignedUrl || member?.imagePath || member?.avatar || faviconUrl;

    return (
        <div className="container mx-auto max-w-3xl px-4 py-8">
            <div className="rounded-lg border p-4 shadow-sm">
                <div className="mb-4">
                    <h1 className="text-2xl font-semibold">
                        {t('publicShare.title', 'Perfil compartido')} · {PROJECT_NAME}
                    </h1>
                    <p className="text-sm text-gray-600">{t('publicShare.subtitle', 'Vista pública para compartir')}</p>
                </div>

                {loading && (
                    <div className="text-gray-700">{t('publicShare.loading', 'Cargando...')}</div>
                )}

                {!loading && error && (
                    <div className="text-red-600">{error}</div>
                )}

                {!loading && !error && member && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                            <img src={imageSrc as string} alt={member?.name || ''}
                                 className="w-32 h-32 object-cover rounded border"/>
                            <div className="min-w-0">
                                <div
                                    className="text-xl font-medium">{member?.name || t('publicShare.unknownName', 'Usuario')}</div>
                                {member?.description && (
                                    <p className="mt-1 whitespace-pre-wrap break-words text-gray-700">{member.description}</p>
                                )}
                                {(!member?.description && (member?.hairDescription || member?.faceDescription)) && (
                                    <div className="mt-2 space-y-1 text-gray-700 text-sm">
                                        {member?.hairDescription && (
                                            <div><span
                                                className="font-medium">{t('group.hairDescription')}:</span> {member.hairDescription}
                                            </div>
                                        )}
                                        {member?.faceDescription && (
                                            <div><span
                                                className="font-medium">{t('group.faceDescription')}:</span> {member.faceDescription}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {member?.matches && typeof member.matches === 'object' && (
                            <div className="mt-2">
                                <div
                                    className="font-semibold mb-2">{t('group.parts.matches', 'Piezas seleccionadas')}</div>
                                <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                                    {Object.entries(member.matches).map(([part, data]) => (
                                        <div key={part} className="rounded border p-2">
                                            <div className="font-medium">{t(`group.parts.${part}`, part)}</div>
                                            {typeof (data as any)?.selectedPiece === 'object' ? (
                                                <div className="text-xs text-gray-600">
                                                    {(data as any).selectedPiece?.name || (data as any).selectedPiece?.id || ''}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Fallback: show raw data for debugging until backend shape is final */}
                        <details className="mt-4">
                            <summary
                                className="cursor-pointer text-sm text-gray-500">{t('publicShare.debugData', 'Ver datos')}</summary>
                            <pre
                                className="mt-2 overflow-auto text-xs bg-gray-50 p-2 rounded border">{JSON.stringify(member, null, 2)}</pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PublicShareView;
