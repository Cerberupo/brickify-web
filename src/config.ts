// Configuration values are resolved from environment variables at build time.
// Astro/Vite exposes only variables prefixed with PUBLIC_ to the client.
// Provide sensible development defaults for local runs.

export const API_URL: string = (import.meta as any).env?.PUBLIC_API_URL ?? 'http://localhost:3000/api';
export const PROJECT_NAME: string = (import.meta as any).env?.PUBLIC_PROJECT_NAME ?? 'Brickify';
export const GOOGLE_CLIENT_ID: string = (import.meta as any).env?.PUBLIC_GOOGLE_CLIENT_ID ?? '176288432372-fvs96cuencuauhojab08lapu3t8c0iip.apps.googleusercontent.com';
export const STRIPE_PUBLISHABLE_KEY: string = (import.meta as any).env?.PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_51RxuwCFIUx31jlb7NwFwILU4JG944HXB6IE8tObyRjILzzgRpdydR8rz4XrmluhDvcXuGMLBJ29OL4gvKEkSafOo000cSlN3Hi';
