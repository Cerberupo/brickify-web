import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_COMPLETED_KEY = 'brickify_onboarding_completed';
const ONBOARDING_STEP_KEY = 'brickify_onboarding_step';
const ONBOARDING_ACTIVE_KEY = 'brickify_onboarding_active';

export function useOnboarding() {
    const [active, setActive] = useState<boolean>(false);
    const [step, setStep] = useState<number>(1);

    // Initialize state from localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const isCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
        const isActive = localStorage.getItem(ONBOARDING_ACTIVE_KEY) === 'true';
        const savedStep = parseInt(localStorage.getItem(ONBOARDING_STEP_KEY) || '1', 10);

        if (!isCompleted && isActive) {
            setActive(true);
            setStep(savedStep);
        }
    }, []);

    const startTour = useCallback(() => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
        localStorage.setItem(ONBOARDING_ACTIVE_KEY, 'true');
        localStorage.setItem(ONBOARDING_STEP_KEY, '1');
        setActive(true);
        setStep(1);
    }, []);

    const setTourStep = useCallback((newStep: number) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(ONBOARDING_STEP_KEY, String(newStep));
        setStep(newStep);
    }, []);

    const nextStep = useCallback(() => {
        setTourStep(step + 1);
    }, [step, setTourStep]);

    const prevStep = useCallback(() => {
        if (step > 1) {
            setTourStep(step - 1);
        }
    }, [step, setTourStep]);

    const stopTour = useCallback(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
        localStorage.removeItem(ONBOARDING_ACTIVE_KEY);
        localStorage.removeItem(ONBOARDING_STEP_KEY);
        setActive(false);
        setStep(1);
    }, []);

    return {
        active,
        step,
        startTour,
        setTourStep,
        nextStep,
        prevStep,
        stopTour
    };
}
