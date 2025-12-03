import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {cn} from "@/lib/utils";
import {RotateCcw} from "lucide-react";
import {getGroupById} from "@/lib";
import {Button} from '@/components/ui/button';
import ShareActions from '@/components/common/ShareActions';
import {toast} from 'sonner';


interface GuestGroupData {
    [key: string]: any;
}

interface LegoItem {
    id: number;
    name: string;
    imageUrl: string;
}

interface LegoCategories {
    hair: LegoItem[];
    head: LegoItem[];
    body: LegoItem[];
    pants: LegoItem[];
}

export interface LegoPreviewCardProps {
    legoSrc?: string;
    personSrc?: string;
    altLego?: string;
    altPerson?: string;
    locale?: 'en' | 'es';
    shared?: boolean;
    /**
     * Optional data for the person to render (equivalent to referencePeople[0]).
     * If provided, the component will use this data (image) and will NOT perform
     * the guest group polling/fetch. If not provided, the existing polling logic
     * (based on URL params) will remain in place.
     */
    referencePerson?: {
        imageSignedUrl?: string | null;
        imagePath?: string | null;
        avatar?: string | null;
        name?: string | null;
        [key: string]: any;
    };
}


/**
 * Interactive card that lets the user toggle between a LEGO render and the original photo.
 * It uses a fancy cross‑fade + slight 3D flip animation and an accessible toggle button.
 */
export default function LegoPreviewCard({
                                            legoSrc = "/people-2.png",
                                            personSrc = "/user.png",
                                            altLego = "LEGO preview",
                                            altPerson = "Photo preview",
                                            locale = 'en',
                                            shared = false,
                                            referencePerson
                                        }: LegoPreviewCardProps) {
    const [mode, setMode] = useState<'lego' | 'photo'>('lego');
    const [guestGroupDetails, setGuestGroupDetails] = useState<GuestGroupData | null>(null);
    const initialProvidedSrc = useMemo(() => {
        const img = referencePerson?.imageSignedUrl || referencePerson?.imagePath || referencePerson?.avatar;
        return (typeof img === 'string' && img.length > 0) ? img : null;
    }, [referencePerson]);
    const [personOverrideSrc, setPersonOverrideSrc] = useState<string | null>(initialProvidedSrc);

    // Keep personOverrideSrc in sync with incoming referencePerson prop
    useEffect(() => {
        if (referencePerson) {
            setPersonOverrideSrc(initialProvidedSrc);
            setGuestGroupDetails({referencePeople: [referencePerson]})
        } else {
            // When referencePerson is removed, clear override so polling or default kicks in
            setPersonOverrideSrc(null);
        }
    }, [referencePerson, initialProvidedSrc]);

    useEffect(() => {
        // If a referencePerson is provided, we skip polling/fetching entirely
        if (referencePerson) return;
        try {
            const params = new URLSearchParams(window.location.search);
            const groupId = params.get('groupId');
            const guestKey = params.get('guest_key');
            if (!groupId || !guestKey) return;

            let intervalId: number | null = null;
            const isFetchingRef = {current: false} as { current: boolean };

            const shouldPoll = (s?: string | null) => s === 'inAssembly' || s === 'inProcess';

            const tick = async () => {
                if (isFetchingRef.current) return;
                isFetchingRef.current = true;
                try {
                    const group = await getGroupById(groupId, {guestKey});
                    console.log('Fetched guest group details:', group);
                    setGuestGroupDetails(group as any);
                    try {
                        const rp = (group as any)?.referencePeople?.[0];
                        const img = rp?.imageSignedUrl || rp?.imagePath;
                        if (img && typeof img === 'string' && img.length > 8) {
                            setPersonOverrideSrc(img);
                        }
                    } catch (_) {
                        // ignore
                    }
                    // Stop polling if status is no longer in active states
                    if (!shouldPoll((group as any)?.status) && intervalId != null) {
                        window.clearInterval(intervalId);
                        intervalId = null;
                    }
                } catch (err) {
                    console.error('Failed to fetch guest group details:', err);
                } finally {
                    isFetchingRef.current = false;
                }
            };

            // Initial fetch
            tick();
            // Poll every 15 seconds
            intervalId = window.setInterval(tick, 15000);

            return () => {
                if (intervalId != null) {
                    window.clearInterval(intervalId);
                }
            };
        } catch (_) {
            // Ignore errors
        }
    }, [referencePerson]);
    const isLego = mode === 'lego';

    // Animation state to coordinate enter/exit transitions
    const [isAnimating, setIsAnimating] = useState(false);
    const prevModeRef = useRef<'lego' | 'photo'>(mode);
    const animTimeoutRef = useRef<number | null>(null);

    const startToggle = () => {
        // set previous mode before changing
        prevModeRef.current = mode;
        setMode(isLego ? 'photo' : 'lego');
        // restart animation
        setIsAnimating(true);
        if (animTimeoutRef.current) {
            window.clearTimeout(animTimeoutRef.current);
            animTimeoutRef.current = null;
        }
        // Match CSS duration (2s)
        animTimeoutRef.current = window.setTimeout(() => {
            setIsAnimating(false);
            animTimeoutRef.current && window.clearTimeout(animTimeoutRef.current);
            animTimeoutRef.current = null;
        }, 1000);
    };

    useEffect(() => {
        return () => {
            if (animTimeoutRef.current) {
                window.clearTimeout(animTimeoutRef.current);
            }
            // clear category timers
            Object.keys(catTimersRef.current).forEach((key) => {
                const t = catTimersRef.current[key];
                if (t) window.clearTimeout(t);
                catTimersRef.current[key] = null;
            });
        };
    }, []);

    // Static defaults (used when no guest group context exists)
    const defaultOptions: LegoCategories = useMemo(() => {
        return {
            hair: [
                {id: 6527258, name: "MINI WIG, NO. 98", imageUrl: "/hair-1.png"},
                {id: 6527259, name: "MINI WIG, NO. 99", imageUrl: "/hair-2.png"},
                {id: 6529258, name: "MINI WIG, NO. 101", imageUrl: "/hair-3.png"}
            ],
            head: [
                {id: 1, name: "Happy Face", imageUrl: "/head-1.png"},
                {id: 2, name: "Serious Face", imageUrl: "/head-2.png"},
                {id: 3, name: "Smiling Face", imageUrl: "/head-3.png"}
            ],
            body: [
                {id: 1, name: "Casual Shirt", imageUrl: "/body-1.png"},
                {id: 2, name: "Formal Suit", imageUrl: "/body-2.png"},
                {id: 3, name: "T-Shirt", imageUrl: "/body-3.png"}
            ],
            pants: [
                {id: 1, name: "Blue Jeans", imageUrl: "/pants-1.png"},
                {id: 2, name: "Black Pants", imageUrl: "/pants-2.png"},
                {id: 3, name: "Shorts", imageUrl: "/pants-3.png"}
            ]
        }
    }, []);

    // Build options from guestGroupDetails (first reference person) when available
    const customizationOptions: LegoCategories = useMemo(() => {
        const placeholderName = locale === 'es' ? 'Cargando…' : 'Loading…';
        const placeholderUrl = '/piece-2.svg'; // generic shadow/placeholder already in public

        const buildFromMatches = (matches: any | undefined | null) => {
            const getItems = (arr: any[] | undefined | null) => {
                if (!arr || !Array.isArray(arr) || arr.length === 0) return [{
                    id: 0,
                    name: placeholderName,
                    imageUrl: placeholderUrl
                }];
                return arr.map((p: any, idx: number) => {
                    const idNum = Number(p?.storePieceId) || Number(p?.id) || idx + 1;
                    const image = p?.storeImage || (Array.isArray(p?.storeImages) && p.storeImages[0]) || placeholderUrl;
                    return {
                        id: idNum,
                        name: String(p?.name || `Piece ${idx + 1}`),
                        imageUrl: String(image)
                    } as LegoItem;
                });
            };

            // When status is not done or matches missing, use single placeholder
            const byCat = (key: string) => {
                const cat = matches?.[key];
                if (!cat || cat.status !== 'done') return [{id: 0, name: placeholderName, imageUrl: placeholderUrl}];
                return getItems(cat.matchedPieceIds);
            };

            return {
                hair: byCat('wig'),
                head: byCat('head'),
                body: byCat('upperPart'),
                pants: byCat('lowerPart')
            } as LegoCategories;
        };

        try {
            const rp = (guestGroupDetails?.referencePeople && guestGroupDetails.referencePeople[0]) || null;
            if (rp && rp.matches) {
                console.log('Building customization options from matches:', rp.matches);
                return buildFromMatches(rp.matches);
            }
        } catch (_) {
            // ignore
        }
        return defaultOptions;
    }, [locale, guestGroupDetails?.referencePeople, defaultOptions]);

    const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({
        hair: (defaultOptions.hair[0]?.id ?? 1),
        head: (defaultOptions.head[0]?.id ?? 1),
        body: (defaultOptions.body[0]?.id ?? 1),
        pants: (defaultOptions.pants[0]?.id ?? 1)
    });

    // When options list changes (e.g., after fetching guest group), ensure selected items exist
    useEffect(() => {
        if (customizationOptions) {
            setSelectedItems({
                hair: customizationOptions.hair[0]?.id ?? 1,
                head: customizationOptions.head[0]?.id ?? 1,
                body: customizationOptions.body[0]?.id ?? 1,
                pants: customizationOptions.pants[0]?.id ?? 1,
            });
        }
    }, [customizationOptions]);

    // Track per-category animations for option changes
    const [catAnim, setCatAnim] = useState<{
        [key: string]: { animating: boolean; outgoing: number | null; incoming: number | null }
    }>({
        hair: {animating: false, outgoing: null, incoming: null},
        head: {animating: false, outgoing: null, incoming: null},
        body: {animating: false, outgoing: null, incoming: null},
        pants: {animating: false, outgoing: null, incoming: null}
    });
    const catTimersRef = useRef<{ [key: string]: number | null }>({hair: null, head: null, body: null, pants: null});

    const handleSelect = (category: keyof LegoCategories, id: number) => {
        setSelectedItems(prev => {
            const prevId = prev[category as string];
            if (prevId === id) return prev;
            // start per-category animation
            setCatAnim(curr => ({
                ...curr,
                [category]: {animating: true, outgoing: prevId, incoming: id}
            }));
            // clear existing timer
            const t = catTimersRef.current[category as string];
            if (t) window.clearTimeout(t);
            // animation duration synced with CSS (400ms)
            catTimersRef.current[category as string] = window.setTimeout(() => {
                setCatAnim(curr => ({
                    ...curr,
                    [category]: {animating: false, outgoing: null, incoming: null}
                }));
                const tt = catTimersRef.current[category as string];
                if (tt) window.clearTimeout(tt);
                catTimersRef.current[category as string] = null;
            }, 400);
            return {...prev, [category]: id};
        });
    };

    const toggleLabel = useMemo(() => {
        if (locale === 'es') return isLego ? 'Ver foto' : 'Ver LEGO';
        return isLego ? 'See photo' : 'See LEGO';
    }, [isLego, locale]);

    // helper to find item by category/id
    const getItem = (category: keyof LegoCategories, id: number) => {
        const arr = customizationOptions[category];
        return arr.find(i => i.id === id) || arr[0];
    };

    // dynamic classes for right-side layers
    const getRightLayerClass = (category: keyof LegoCategories, which: 'outgoing' | 'incoming' | 'rest') => {
        const c = catAnim[category as string];
        if (c?.animating) {
            if (which === 'outgoing') return 'exit-layer-right';
            if (which === 'incoming') return 'enter-layer-right';
        }
        return 'layer-right-active';
    };

    const orderedCats: (keyof LegoCategories)[] = ['hair', 'head', 'body', 'pants'];

    // Helpers for actions (download JSON, share)
    const normalizeId = (p: any): string | null => {
        if (!p) return null;
        if (typeof p === 'string' || typeof p === 'number') return String(p);
        const id = p.storePieceId || p.elementId || p.id || p._id || p.pieceId;
        return id ? String(id) : null;
    };

    const handleDownloadJson = useCallback(() => {
        try {
            const rp = (guestGroupDetails as any)?.referencePeople?.[0];
            const matches = rp?.matches || {};
            const byKey: Array<{ ui: keyof LegoCategories; key: string }> = [
                {ui: 'hair', key: 'wig'},
                {ui: 'head', key: 'head'},
                {ui: 'body', key: 'upperPart'},
                {ui: 'pants', key: 'lowerPart'}
            ];
            const elementIds: string[] = [];
            byKey.forEach(({ui, key}) => {
                const m = matches?.[key];
                const arr = Array.isArray(m?.matchedPieceIds) ? m.matchedPieceIds : [];
                const selId = selectedItems[ui] != null ? String(selectedItems[ui]) : null;
                if (selId) {
                    const found = arr.find((p: any) => normalizeId(p) === selId);
                    const elementId = found?.storePieceId || found?.elementId || selId;
                    if (elementId) elementIds.push(String(elementId));
                }
            });
            if (elementIds.length === 0) {
                toast.info(locale === 'es' ? 'No hay piezas seleccionadas para descargar.' : 'No pieces selected to download.');
                return;
            }
            const payload = elementIds.map(eid => ({elementId: eid, quantity: 1}));
            const json = JSON.stringify(payload, null, 2);
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const safeName = (rp?.name || 'pieces').toString().trim().replace(/\s+/g, '-');
            a.href = url;
            a.download = `${safeName}-pieces.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 0);
        } catch (e) {
            toast.error(locale === 'es' ? 'No se pudo generar el JSON de piezas.' : 'Failed to generate pieces JSON.');
        }
    }, [guestGroupDetails, selectedItems, locale]);

    // Share state and handlers have been extracted to ShareActions component

    return (
        <div className="w-full h-auto md:w-[910px] md:h-[635px] relative">
            <div
                className="relative rounded-[16px] bg-white backdrop-blur-sm border w-full md:h-full  shadow-md overflow-visible z-20">
                {/* Floating round toggle button */}
                <button
                    type="button"
                    aria-label={toggleLabel}
                    aria-pressed={!isLego}
                    onClick={startToggle}
                    className="absolute cursor-pointer border top-3 -translate-x-11 md:translate-0 left-full md:left-[355px] z-20 size-8 grid place-items-center rounded-full bg-[#FAFAFA] hover:bg-[#F2F2F2] transition-colors"
                >
                    <RotateCcw className="size-4 text-muted-foreground"/>
                </button>

                <div className="flex flex-col md:flex-row items-stretch md:h-full">
                    <div className="flex items-stretch h-[635px] md:h-full w-full md:w-[44%] relative">
                        {/* Left: image area */}
                        {(() => {
                            const prev = prevModeRef.current;
                            const outgoing = isAnimating ? prev : null;
                            const incoming = isAnimating ? (prev === 'lego' ? 'photo' : 'lego') : null;

                            const getPanelClass = (panel: 'lego' | 'photo') => {
                                if (isAnimating) {
                                    if (panel === outgoing) return 'exit-waiting-preview';
                                    if (panel === incoming) return 'enter-waiting-preview';
                                }
                                // resting state
                                const isActive = panel === mode;
                                return isActive ? 'waiting-preview-active' : 'waiting-preview-inactive';
                            };

                            return (
                                <>
                                    <div
                                        className={cn("rounded-[16px] absolute w-full h-full bg-white p-[26px]", getPanelClass('lego'))}>
                                        <div className="relative h-full w-full">
                                        <span
                                            className="absolute top-0 -translate-y-1/2 -translate-x-[15px] left-0 z-10 px-3 py-1 text-[12px] font-semibold rounded-full bg-[#6A3DF4]/15 text-[#6A3DF4] select-none">LEGO</span>
                                            <img
                                                src={legoSrc}
                                                alt={altLego}
                                                className="absolute inset-0 size-full object-cover select-none"
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>

                                    <div
                                        className={cn("rounded-[16px] absolute w-full h-full bg-white p-[26px]", getPanelClass('photo'))}>
                                        <div className="relative h-full w-full">
                                        <span
                                            className="absolute top-0 -translate-y-1/2 -translate-x-[15px] left-0 z-10 px-3 py-1 text-[12px] font-semibold rounded-full bg-[#3C204E] text-white select-none">Foto</span>
                                            <img
                                                src={personOverrideSrc || personSrc}
                                                alt={altPerson}
                                                className="absolute inset-0 size-full object-cover select-none"
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                    </div>

                    {/* Right: options grid */}
                    <div
                        className="w-full md:w-[56%] p-[6px] md:pl-0 md:pt-[6px] md:pb-[6px] md:pr-[6px]">
                        {/* Categories grid */}
                        <div
                            className="flex items-center justify-center h-full w-full bg-[#FAFAFA] rounded-[16px] md:rounded-r-[16px]">
                            <div
                                className="w-full flex flex-col items-center justify-center p-[16px] md:p-0 gap-[6px]">
                                {Object.entries(customizationOptions).map(([category, items], index) => {
                                    return <div
                                        key={index}
                                        className="w-full flex gap-[6px] items-center justify-center">
                                        {items.map((item: any) => {
                                            const isSelected = selectedItems[category] === item.id;
                                            return (
                                                <button
                                                    key={`${category}-${item.id}`}
                                                    type="button"
                                                    onClick={() => handleSelect(category as keyof LegoCategories, item.id)}
                                                    aria-pressed={isSelected}
                                                    className={cn(
                                                        "w-1/3  md:w-[121px] aspect-square rounded-[8px] shadow-xs flex items-center justify-center transition-colors duration-200 cursor-pointer select-none focus:outline-none",
                                                        isSelected ? "bg-[#FFF3D6] border border-[#F9C14A]" : "bg-white/90 hover:bg-[#FFF3D6]"
                                                    )}
                                                >
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.name}
                                                        className="h-6 w-10 md:h-8 md:w-14 rounded-md object-cover"
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className="pointer-events-none static w-11/12 m-0 mx-auto md:w-auto md:absolute md:right-0 md:top-10 -z-10 flex flex-col md:gap-2 rounded-[8px] md:rounded-none overflow-hidden md:overflow-visible -mt-2 md:mt-0">
                {orderedCats.map((cat, idx) => {
                    const c = catAnim[cat as string];
                    const current = getItem(cat, selectedItems[cat as string]);
                    const prevId = c?.outgoing ?? null;
                    const prevItem = prevId ? getItem(cat, prevId) : null;

                    const Badge = ({item, className}: { item: LegoItem, className?: string }) => (
                        <div
                            className={cn("relative pointer-events-auto select-none md:rounded-r-[8px] p-[6px] bg-white", className)}>
                            <div
                                className="text-[12px] leading-tight bg-[#FAFAFA] rounded-r-[8px] pl-[24px] p-[14px]">
                                <div className="text-[15px] whitespace-nowrap">{item.name}</div>
                                <div className="text-[14px] whitespace-nowrap">ID:
                                    <span className="font-light">{item.id}</span>
                                </div>
                            </div>
                        </div>
                    );

                    return (
                        <div key={cat + '-' + idx} className="relative">
                            {/* Outgoing */}
                            {c?.animating && prevItem && (
                                <Badge item={prevItem} className={getRightLayerClass(cat, 'outgoing')}/>
                            )}
                            {/* Incoming or resting */}
                            <Badge item={current}
                                   className={c?.animating ? getRightLayerClass(cat, 'incoming') : getRightLayerClass(cat, 'rest')}/>
                        </div>
                    );
                })}
            </div>

            {/* Acciones (Descargar / Compartir) cuando hay piezas generadas para el primer miembro,
                siguiendo la lógica de GroupedReferenceList (matches[part].status === 'done' y hay elementos). */}
            {(() => {
                const rp = (guestGroupDetails as any)?.referencePeople?.[0];
                if (!rp || !rp.matches) return null;
                const matches = rp.matches as Record<string, any>;
                const hasGeneratedPieces = Object.keys(matches).some((k) => {
                    const m = matches[k];
                    const partStatus = String(m?.status || '').toLowerCase();
                    const arr = Array.isArray(m?.matchedPieceIds) ? m.matchedPieceIds : [];
                    return partStatus === 'done' && arr.length > 0;
                });
                if (!hasGeneratedPieces) return null;
                return (
                    <div className="mt-3 flex items-center gap-3 justify-end">
                        <Button variant="secondary" onClick={handleDownloadJson}>
                            {locale === 'es' ? 'Descargar JSON' : 'Download JSON'}
                        </Button>
                        {(() => {
                            const params = new URLSearchParams(window.location.search);
                            const groupId = params.get('groupId') || '';
                            const guestKey = params.get('guest_key');
                            const rpId = rp?.id as string | undefined;
                            const groupShareId = (guestGroupDetails as any)?.share?.id as string | undefined;
                            const personShareId = rp?.share?.id as string | undefined;
                            if (!groupId || !rpId) return null;
                            return (
                                <ShareActions
                                    groupId={groupId}
                                    personId={rpId}
                                    groupShareId={groupShareId}
                                    personShareId={personShareId}
                                    initialEnabled={Boolean(rp?.share?.enabled)}
                                    locale={locale}
                                    guestKey={guestKey}
                                />
                            );
                        })()}
                    </div>
                );
            })()}

        </div>
    );
}
