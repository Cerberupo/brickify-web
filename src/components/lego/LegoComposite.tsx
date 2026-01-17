import React, {useMemo, useState} from 'react';
import {RotateCcw} from 'lucide-react';
import {getStableImageSrc, invalidateImage, makeUrlKey} from '@/lib/lego/imageCache';

export type SideImages = {
    front: string;
    back: string;
};

export type LegoCompositeProps = {
    /**
     * Imágenes y posición de cada parte. Todas son opcionales: solo se renderizan las provistas.
     */
    wig?: SideImages;
    head?: SideImages;
    upperPart?: SideImages;
    lowerPart?: SideImages;

    /**
     * Clase y estilos del contenedor. El contenedor es position: relative.
     * Asegúrate de darle un tamaño (width/height) desde fuera (por clase o style) si no ocupa espacio.
     */
    className?: string;
    style?: React.CSSProperties;

    /** Texto accesible del botón de giro */
    toggleAriaLabel?: string;

    /** Idioma para las etiquetas del botón (por ahora 'en' | 'es'). Default: 'en' */
    locale?: 'en' | 'es';

    /**
     * Control externo del lado a mostrar. Si se proporciona, el componente es "controlado"
     * respecto al lado y usará este valor en lugar de su estado interno.
     */
    side?: 'front' | 'back';

    /** Callback cuando se cambia el lado (útil en modo controlado) */
    onSideChange?: (side: 'front' | 'back') => void;

    /** Si es true, oculta el botón de alternar vista frontal/trasera */
    hideToggle?: boolean;

    /** Configuración de CORS para las imágenes */
    crossOrigin?: 'anonymous' | 'use-credentials' | '';
};

/**
 * LegoComposite
 *
 * Componente que superpone imágenes (frontal/trasera) de distintas partes de una figura tipo LEGO
 * (peluca, cabeza, parte superior e inferior) dentro de un contenedor con position: relative.
 * Cada capa se posiciona con position: absolute usando porcentajes para width/height/left/top.
 * Incluye un botón con icono para alternar entre usar las imágenes front o back.
 */
const LegoComposite: React.FC<LegoCompositeProps> = ({
                                                         wig,
                                                         head,
                                                         upperPart,
                                                         lowerPart,
                                                         className,
                                                         style,
                                                         toggleAriaLabel,
                                                         locale = 'en',
                                                         side,
                                                         onSideChange,
                                                         hideToggle = false,
                                                         crossOrigin,
                                                     }) => {
    const [internalUseBack, setInternalUseBack] = useState(false);
    const useBack = (side ? side === 'back' : internalUseBack);

    const labels = useMemo(() => {
        if (locale === 'es') {
            return {
                front: 'Frontal',
                back: 'Trasera',
                toggle: 'Girar vista (frontal/trasera)'
            } as const;
        }
        return {
            front: 'Front',
            back: 'Back',
            toggle: 'Toggle view (front/back)'
        } as const;
    }, [locale]);

    const pieces = useMemo(() => {
        return [
            {key: 'wig', data: wig},
            {key: 'head', data: head},
            {key: 'upperPart', data: upperPart},
            {key: 'lowerPart', data: lowerPart},
        ].filter((p) => !!p.data) as { key: keyof Layout; data: SideImages }[];
    }, [wig, head, upperPart, lowerPart]);

    // Posiciones fijas internas (por ahora a piñón)
    type Layout = {
        wig: { widthPct: number; heightPct: number; leftPct: number; topPct: number; zIndex: number };
        head: { widthPct: number; heightPct: number; leftPct: number; topPct: number; zIndex: number };
        upperPart: { widthPct: number; heightPct: number; leftPct: number; topPct: number; zIndex: number };
        lowerPart: { widthPct: number; heightPct: number; leftPct: number; topPct: number; zIndex: number };
    };

    const layout: Layout = {
        // Valores placeholder: ajusta a tu gusto más tarde
        wig: {widthPct: 62, heightPct: 124, leftPct: 19, topPct: -19, zIndex: 4},
        head: {widthPct: 29, heightPct: 29, leftPct: 35.5, topPct: 13.7, zIndex: 3},
        upperPart: {widthPct: 70, heightPct: 70, leftPct: 15, topPct: 10, zIndex: 2},
        lowerPart: {widthPct: 58, heightPct: 58, leftPct: 21.2, topPct: 35.5, zIndex: 1},
    };

    return (
        <div
            className={['relative select-none w-full pb-[167%]', className].filter(Boolean).join(' ')}
            style={style}
        >
            {pieces.map(({key, data}) => {
                const freshSrc = useBack ? data.back : data.front;
                const alt = `${key}-${useBack ? 'back' : 'front'}`;
                const pos = layout[key];
                const pieceStyle: React.CSSProperties = {
                    position: 'absolute',
                    width: `${pos.widthPct}%`,
                    height: `${pos.heightPct}%`,
                    left: `${pos.leftPct}%`,
                    top: `${pos.topPct}%`,
                    zIndex: pos.zIndex,
                    objectFit: 'contain',
                    pointerEvents: 'none',
                };
                return (
                    <img
                        key={key}
                        src={getStableImageSrc(`${makeUrlKey(freshSrc)}::${alt}`, freshSrc) || freshSrc}
                        alt={alt}
                        style={pieceStyle}
                        draggable={false}
                        crossOrigin={crossOrigin}
                        onError={(e) => {
                            const k = `${makeUrlKey(freshSrc)}::${alt}`;
                            invalidateImage(k);
                            try {
                                const target = e.currentTarget as HTMLImageElement;
                                // Limpiar crossOrigin si estaba presente para intentar carga normal
                                target.removeAttribute('crossorigin');
                                target.src = freshSrc;
                            } catch {
                            }
                        }}
                    />
                );
            })}

            {/* Botón para alternar vista frontal/trasera */}
            {!hideToggle && (
                <button
                    type="button"
                    aria-label={toggleAriaLabel ?? labels.toggle}
                    onClick={() => {
                        const next = useBack ? 'front' : 'back';
                        if (onSideChange) {
                            onSideChange(next);
                        } else {
                            setInternalUseBack((v) => !v);
                        }
                    }}
                    className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-black/10 bg-white/90 px-2 py-1 text-xs shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500/60 dark:border-white/10 dark:bg-black/60"
                >
                    <RotateCcw className="h-4 w-4"/>
                    <span>{useBack ? labels.back : labels.front}</span>
                </button>
            )}
        </div>
    );
};

export default LegoComposite;
