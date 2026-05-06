// Configuration values are resolved from environment variables at build time.
// Astro/Vite exposes only variables prefixed with PUBLIC_ to the client.
// Provide sensible development defaults for local runs.

const envOrDefault = (value: unknown, fallback: string): string => {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
};

export const API_URL: string = envOrDefault((import.meta as any).env?.PUBLIC_API_URL, 'http://localhost:3000/api');
export const PROJECT_NAME: string = envOrDefault((import.meta as any).env?.PUBLIC_PROJECT_NAME, 'Brickify');
export const GOOGLE_CLIENT_ID: string = envOrDefault((import.meta as any).env?.PUBLIC_GOOGLE_CLIENT_ID, '176288432372-fvs96cuencuauhojab08lapu3t8c0iip.apps.googleusercontent.com');
export const STRIPE_PUBLISHABLE_KEY: string = envOrDefault((import.meta as any).env?.PUBLIC_STRIPE_PUBLISHABLE_KEY, 'pk_test_51RxuwCFIUx31jlb7NwFwILU4JG944HXB6IE8tObyRjILzzgRpdydR8rz4XrmluhDvcXuGMLBJ29OL4gvKEkSafOo000cSlN3Hi');
