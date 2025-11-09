import React, {useEffect, useMemo, useRef, useState} from "react";
import {cn} from "@/lib/utils";
import {RotateCcw} from "lucide-react";

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
                                            locale = 'en'
                                        }: LegoPreviewCardProps) {
    const [mode, setMode] = useState<'lego' | 'photo'>('lego');
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

    const customizationOptions: LegoCategories = {
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
    };

    const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({
        hair: 1,
        head: 1,
        body: 1,
        pants: 1
    });

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

    return (
        <div className="w-full h-auto md:w-[910px] md:h-[635px] relative">

            <div
                className="pointer-events-none absolute right-0 top-10 -z-10 flex flex-col gap-2">
                {orderedCats.map((cat, idx) => {
                    const c = catAnim[cat as string];
                    const current = getItem(cat, selectedItems[cat as string]);
                    const prevId = c?.outgoing ?? null;
                    const prevItem = prevId ? getItem(cat, prevId) : null;

                    const Badge = ({item, className}: { item: LegoItem, className?: string }) => (
                        <div
                            className={cn("relative pointer-events-auto select-none rounded-r-[8px] p-[6px] bg-white", className)}>
                            <div className="text-[12px] leading-tight bg-[#FAFAFA] rounded-r-[8px] pl-[24px] p-[14px]">
                                <div className="text-[15px] whitespace-nowrap">{item.name}</div>
                                <div className="text-[14px] whitespace-nowrap">ID: <span
                                    className="font-light">{item.id}</span></div>
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

            <div
                className="relative rounded-[16px] bg-white backdrop-blur-sm border w-full h-full  shadow-md overflow-visible">
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

                <div className="flex flex-col md:flex-row items-stretch h-full">
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
                                                src={personSrc}
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
                        className="w-full md:w-[56%] pl-0 pt-[6px] pb-[6px] pr-[6px]">
                        {/* Categories grid */}
                        <div className="flex items-center justify-center h-full w-full bg-[#FAFAFA] rounded-r-[16px]">
                            <div className=" grid [grid-template-columns:repeat(3,max-content)] gap-[6px]">
                                {Object.entries(customizationOptions).map(([category, items]) =>
                                    items.map((item) => {
                                        const isSelected = selectedItems[category] === item.id;
                                        return (
                                            <button
                                                key={`${category}-${item.id}`}
                                                type="button"
                                                onClick={() => handleSelect(category as keyof LegoCategories, item.id)}
                                                aria-pressed={isSelected}
                                                className={cn(
                                                    "w-[88px] h-[88px] md:w-[121px] md:h-[121px] aspect-square rounded-[8px] shadow-xs flex items-center justify-center transition-colors duration-200 cursor-pointer select-none focus:outline-none",
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
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
