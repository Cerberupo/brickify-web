/**
 * Group-related constants
 */

/**
 * Canonical values for group types used across the app and API payloads
 */
export const GROUP_TYPE_VALUES = {
    WEDDING_FAMILY: 'weddingFamily',
    COMPANY_EMPLOYEES: 'companyEmployees',
    FRIENDS_FAMILY: 'friendsFamily',
    OTHER: 'other',
} as const;

/**
 * Convenience array of values for iteration (e.g., building selects)
 */
export const GROUP_TYPE_LIST = [
    GROUP_TYPE_VALUES.WEDDING_FAMILY,
    GROUP_TYPE_VALUES.COMPANY_EMPLOYEES,
    GROUP_TYPE_VALUES.FRIENDS_FAMILY,
    GROUP_TYPE_VALUES.OTHER
] as const;

/**
 * Type representing a valid group type value
 */
export type GroupType = typeof GROUP_TYPE_VALUES[keyof typeof GROUP_TYPE_VALUES];
