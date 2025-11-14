import {type classNameValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import type {Group} from "@/lib/types";
import {GROUP_STATUS_ENUM} from "@/constants";

export function cn(...inputs: classNameValue[]) {
    return twMerge(clsx(inputs))
}

export function navigate(route: string, params?: Record<string, string>) {
    let finalRoute = route;

    // 1) Replace all occurrences of {paramName} with the corresponding value from params
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            finalRoute = finalRoute.replace(new RegExp(`{${key}}`, 'g'), value);
        });
    }

    // 2) If current URL has a locale prefix (/es or /en) and the target path does not,
    //    automatically prefix the same locale. Do not touch absolute URLs.
    try {
        if (typeof window !== 'undefined') {
            const isAbsolute = /^(https?:|mailto:|tel:|\/\/)/i.test(finalRoute);
            if (!isAbsolute) {
                // Ensure leading slash for relative paths
                if (finalRoute && !finalRoute.startsWith('/')) {
                    finalRoute = `/${finalRoute}`;
                }

                const currSeg = window.location.pathname.split('/')[1]?.toLowerCase();
                const hasCurrLocale = currSeg === 'es' || currSeg === 'en';
                const hasTargetLocale = finalRoute.startsWith('/es/') || finalRoute === '/es' || finalRoute.startsWith('/en/') || finalRoute === '/en';

                if (hasCurrLocale && !hasTargetLocale) {
                    // Special case: navigate to root
                    if (finalRoute === '/' || finalRoute === '') {
                        finalRoute = `/${currSeg}`;
                    } else {
                        finalRoute = `/${currSeg}${finalRoute}`;
                    }
                }
            }
        }
    } catch (_e) {
        // ignore and fall back to original finalRoute
    }

    console.log('finalRoute', finalRoute);
    window.location.href = finalRoute;
}

// Export a utility function to check if a group has already paid
export const hasGroupAlreadyPaidStatus = (group: Group): boolean => {
    // If the status is NOT one of these, it means the order has been paid
    return ![GROUP_STATUS_ENUM.needsMoreUsers, GROUP_STATUS_ENUM.readyForPayment].includes(group.status);
};