import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';
import { useTranslation } from 'react-i18next';

interface OnboardingTooltipProps {
    targetSelector: string;
    step: number;
    totalSteps: number;
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
}

export function OnboardingTooltip({
    targetSelector,
    step,
    totalSteps,
    content,
    placement = 'bottom',
    onNext,
    onBack,
    onSkip
}: OnboardingTooltipProps) {
    const { t } = useTranslation();
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const [targetFound, setTargetFound] = useState(false);

    const updatePosition = () => {
        const target = document.querySelector(targetSelector);
        if (!target) {
            setTargetFound(false);
            return;
        }

        setTargetFound(true);
        const targetRect = target.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        let tooltipTop = 0;
        let tooltipLeft = 0;

        // Gap between target and tooltip
        const gap = 12;

        const tooltipWidth = tooltipRef.current?.offsetWidth || 320;
        const tooltipHeight = tooltipRef.current?.offsetHeight || 150;

        if (placement === 'bottom') {
            tooltipTop = targetRect.bottom + scrollY + gap;
            tooltipLeft = targetRect.left + scrollX + (targetRect.width - tooltipWidth) / 2;
        } else if (placement === 'top') {
            tooltipTop = targetRect.top + scrollY - tooltipHeight - gap;
            tooltipLeft = targetRect.left + scrollX + (targetRect.width - tooltipWidth) / 2;
        } else if (placement === 'left') {
            tooltipTop = targetRect.top + scrollY + (targetRect.height - tooltipHeight) / 2;
            tooltipLeft = targetRect.left + scrollX - tooltipWidth - gap;
        } else if (placement === 'right') {
            tooltipTop = targetRect.top + scrollY + (targetRect.height - tooltipHeight) / 2;
            tooltipLeft = targetRect.right + scrollX + gap;
        }

        // Keep inside screen bounds
        if (tooltipLeft < 10) tooltipLeft = 10;
        if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
            tooltipLeft = window.innerWidth - tooltipWidth - 10;
        }

        setCoords({ top: tooltipTop, left: tooltipLeft });

        // Scroll to target if not fully visible
        const isElementInViewport = (el: Element) => {
            const rect = el.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
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

    if (!targetFound || !coords) {
        return null;
    }

    return (
        <>
            {/* Spotlight overlay effect highlight */}
            <div
                className="fixed inset-0 pointer-events-none z-[9998] transition-opacity duration-300 bg-black/30"
                style={{ mixBlendMode: 'multiply' }}
            />

            {/* Floating Tooltip Bubble */}
            <div
                ref={tooltipRef}
                style={{
                    position: 'absolute',
                    top: `${coords.top}px`,
                    left: `${coords.left}px`,
                    transition: 'top 0.2s ease, left 0.2s ease',
                }}
                className="z-[9999] w-[320px] bg-white text-slate-900 rounded-xl p-5 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header / Step indicator */}
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        {t('onboarding.step', 'Tutorial')} {step} / {totalSteps}
                    </span>
                    <button
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

                {/* Action buttons */}
                <div className="flex justify-between items-center mt-2">
                    <div>
                        {step > 1 && (
                            <Button variant="outline" size="sm" onClick={onBack}>
                                {t('onboarding.back', 'Atrás')}
                            </Button>
                        )}
                    </div>
                    <div>
                        <Button size="sm" onClick={onNext}>
                            {step === totalSteps ? t('onboarding.finish', 'Finalizar') : t('onboarding.next', 'Siguiente')}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
