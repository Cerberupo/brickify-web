// @ts-check

import tailwindcss from '@tailwindcss/vite';
import {defineConfig} from 'astro/config';
import sitemap from '@astrojs/sitemap';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    site: 'https://brickify.fun',
    output: 'static',
    vite: {
        plugins: [tailwindcss()],
    },

    integrations: [react(), sitemap()],
});
