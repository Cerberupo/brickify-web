import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui';
import { useTranslation } from 'react-i18next';

interface OnboardingTooltipProps {
    targetSelector: string;
    step: number;
    totalSteps: number;
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    onNext: () => void;
    onBack?: () => void;
    onSkip: () => void;
}

interface TargetDimensions {
    top: number;
    left: number;
    width: number;
    height: number;
}

export function OnboardingTooltip({
    targetSelector,
    step,
    totalSteps,
    content,
    placement = 'bottom',
    onNext,
    onSkip
}: OnboardingTooltipProps) {
    const { t } = useTranslation();
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const [targetRect, setTargetRect] = useState<TargetDimensions | null>(null);
    const [targetFound, setTargetFound] = useState(false);

    const updatePosition = () => {
        let selector = targetSelector;
        // Si el formulario de añadir miembro está activo pero se abre la modal de recortar imagen, reenfocar el spotlight a esa modal
        if (selector === '#tour-add-member-form' && document.querySelector('#tour-image-cropper-dialog')) {
            selector = '#tour-image-cropper-dialog';
        }
        const target = document.querySelector(selector);
        if (!target) {
            setTargetFound(false);
            return;
        }

        setTargetFound(true);
        const rect = target.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        // Store the target's absolute dimensions for the spotlight mask
        setTargetRect({
            top: rect.top + scrollY,
            left: rect.left + scrollX,
            width: rect.width,
            height: rect.height
        });

        let tooltipTop = 0;
        let tooltipLeft = 0;

        // Gap between target and tooltip
        const gap = 12;

        const tooltipWidth = tooltipRef.current?.offsetWidth || 320;
        const tooltipHeight = tooltipRef.current?.offsetHeight || 150;

        if (placement === 'bottom') {
            tooltipTop = rect.bottom + scrollY + gap;
            tooltipLeft = rect.left + scrollX + (rect.width - tooltipWidth) / 2;
        } else if (placement === 'top') {
            tooltipTop = rect.top + scrollY - tooltipHeight - gap;
            tooltipLeft = rect.left + scrollX + (rect.width - tooltipWidth) / 2;
        } else if (placement === 'left') {
            tooltipTop = rect.top + scrollY + (rect.height - tooltipHeight) / 2;
            tooltipLeft = rect.left + scrollX - tooltipWidth - gap;
        } else if (placement === 'right') {
            tooltipTop = rect.top + scrollY + (rect.height - tooltipHeight) / 2;
            tooltipLeft = rect.right + scrollX + gap;
        }

        // Keep inside screen bounds
        if (tooltipLeft < 10) tooltipLeft = 10;
        if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
            tooltipLeft = window.innerWidth - tooltipWidth - 10;
        }

        setCoords({ top: tooltipTop, left: tooltipLeft });

        // Scroll to target if not fully visible
        const isElementInViewport = (el: Element) => {
            const r = el.getBoundingClientRect();
            return (
                r.top >= 0 &&
                r.left >= 0 &&
                r.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                r.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        };

        if (!isElementInViewport(target)) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    useEffect(() => {
        // Run update position on mount and whenever deps change
        updatePosition();

        // Recalculate on resize and scroll
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        // Polling as safety fallback (for modals or elements rendering asynchronously)
        const interval = setInterval(updatePosition, 300);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
            clearInterval(interval);
        };
    }, [targetSelector, placement, content]);

    if (!targetFound || !coords || !targetRect) {
        return null;
    }

    return createPortal(
        <>
            {/* Spotlight Focus Overlay - Static dark background mask */}
            <div
                style={{
                    position: 'absolute',
                    top: `${targetRect.top}px`,
                    left: `${targetRect.left}px`,
                    width: `${targetRect.width}px`,
                    height: `${targetRect.height}px`,
                    boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)',
                    borderRadius: '8px',
                    transition: 'all 0.15s ease-out',
                }}
                className="z-[9990] pointer-events-none"
            />

            {/* Spotlight Highlight Ring - Pulsing outline without fading the background overlay */}
            <div
                style={{
                    position: 'absolute',
                    top: `${targetRect.top}px`,
                    left: `${targetRect.left}px`,
                    width: `${targetRect.width}px`,
                    height: `${targetRect.height}px`,
                    borderRadius: '8px',
                    transition: 'all 0.15s ease-out',
                }}
                className="z-[9991] pointer-events-none ring-4 ring-primary ring-offset-2 ring-offset-slate-900 animate-pulse"
            />

            {/* Floating Tooltip Bubble */}
            <div
                ref={tooltipRef}
                style={{
                    position: 'absolute',
                    top: `${coords.top}px`,
                    left: `${coords.left}px`,
                    transition: 'top 0.15s ease-out, left 0.15s ease-out',
                }}
                className="z-[9999] w-[320px] bg-white text-slate-900 rounded-xl p-5 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
                onPointerDownCapture={(e) => e.stopPropagation()}
                onMouseDownCapture={(e) => e.stopPropagation()}
            >
                {/* Header / Step indicator */}
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        {t('onboarding.step', 'Tutorial')} {step} / {totalSteps}
                    </span>
                    <button
                        type="button"
                        onClick={onSkip}
                        className="text-xs text-muted-foreground hover:text-slate-900 transition-colors"
                    >
                        {t('onboarding.skip', 'Omitir')}
                    </button>
                </div>

                {/* Content */}
                <p className="text-sm leading-relaxed text-slate-700 font-normal">
                    {content}
                </p>

                {/* Action buttons - Only show "Finalizar" on the final step */}
                {step === totalSteps && (
                    <div className="flex justify-end items-center mt-2">
                        <Button type="button" size="sm" onClick={onNext}>
                            {t('onboarding.finish', 'Finalizar')}
                        </Button>
                    </div>
                )}
            </div>
        </>,
        document.body
    );
}
