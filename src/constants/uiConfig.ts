/**
 * UI configuration constants
 * This file contains UI-related configuration constants used throughout the application
 */


/**
 * Maximum number of pending groups allowed before disabling the create button
 */
export const MAX_PENDING_GROUPS = 5;

/**
 * Status colors and messages for group status
 */
export const GROUP_STATUS = {
    // New statuses based on user flow
    needsMoreUsers: {
        color: 'bg-red-100 text-red-800',
        message: 'dashboard.groupStatus.needsMoreUsers'
    },
    readyForPayment: {
        color: 'bg-purple-100 text-purple-800',
        message: 'dashboard.groupStatus.readyForPayment'
    },
    inProcess: {
        color: 'bg-blue-100 text-blue-800',
        message: 'dashboard.groupStatus.inProcess'
    },
    waitingForApproval: {
        color: 'bg-indigo-100 text-indigo-800',
        message: 'dashboard.groupStatus.waitingForApproval'
    },
    orderPlaced: {
        color: 'bg-cyan-100 text-cyan-800',
        message: 'dashboard.groupStatus.orderPlaced'
    },
    orderIncomplete: {
        color: 'bg-amber-100 text-amber-800',
        message: 'dashboard.groupStatus.orderIncomplete'
    },
    inReview: {
        color: 'bg-teal-100 text-teal-800',
        message: 'dashboard.groupStatus.inReview'
    },
    inAssembly: {
        color: 'bg-emerald-100 text-emerald-800',
        message: 'dashboard.groupStatus.inAssembly'
    },
    readyForShipment: {
        color: 'bg-lime-100 text-lime-800',
        message: 'dashboard.groupStatus.readyForShipment'
    },
    shipped: {
        color: 'bg-green-100 text-green-800',
        message: 'dashboard.groupStatus.shipped'
    },
};

export const GROUP_STATUS_ENUM = {
    // New statuses based on user flow
    needsMoreUsers: 'needsMoreUsers',
    readyForPayment: 'readyForPayment',
    inProcess: 'inProcess',
    waitingForApproval: 'waitingForApproval',
    orderPlaced: 'orderPlaced',
    orderIncomplete: 'orderIncomplete',
    inReview: 'inReview',
    inAssembly: 'inAssembly',
    readyForShipment: 'readyForShipment',
    shipped: 'shipped',
};