import {type classNameValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import type {Group} from "@/lib/types";
import {GROUP_STATUS_ENUM} from "@/constants";

export function cn(...inputs: classNameValue[]) {
    return twMerge(clsx(inputs))
}

export function navigate(route: string, params?: Record<string, string>) {
    let finalRoute = route;

    if (params) {
        // Replace all occurrences of {paramName} with the corresponding value from params
        Object.entries(params).forEach(([key, value]) => {
            finalRoute = finalRoute.replace(new RegExp(`{${key}}`, 'g'), value);
        });
    }

    window.location.href = finalRoute;
}

// Export a utility function to check if a group has already paid
export const hasGroupAlreadyPaidStatus = (group: Group): boolean => {
    // If the status is NOT one of these, it means the order has been paid
    return ![GROUP_STATUS_ENUM.needsMoreUsers, GROUP_STATUS_ENUM.readyForPayment].includes(group.status);
};