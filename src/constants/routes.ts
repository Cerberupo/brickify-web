/**
 * Enum for all routes in the application
 * This centralizes all route definitions and makes it easier to update them
 */
export enum APP_ROUTES {
    // Main routes
    HOME = '/',
    DASHBOARD = '/dashboard/',
    LOGIN = '/login/',
    REGISTER = '/register/',
    GROUP = '/group/?id={id}',

    // Footer routes
    TERMS = '/terms/',
    PRIVACY = '/privacy/',
    CONTACT = '/contact/',

    // Language routes
    ENGLISH = '/en/',
    SPANISH = '/es/'
}