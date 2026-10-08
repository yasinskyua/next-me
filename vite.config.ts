import process from 'node:process';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// GitHub Pages віддає 404.html на будь-яку невідому адресу, а він піднімає застосунок
			adapter: adapter({ fallback: '404.html' }),
			// На Pages сайт живе під /<назва-репо>, у dev — у корені
			paths: {
				base: (process.argv.includes('dev') ? '' : (process.env.BASE_PATH ?? '')) as '' | `/${string}`
			}
		})
	]
});
