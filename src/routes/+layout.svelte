<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import { auth } from '#lib/auth.svelte.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const onLogin = $derived(page.route.id === '/login');
	// Охорона маршрутів лише для зручності: дані захищає RLS у базі
	const allowed = $derived(auth.ready && (auth.session ? !onLogin : onLogin));

	$effect(() => {
		if (auth.ready && !allowed) goto(resolve(auth.session ? '/' : '/login'), { replace: true });
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Next Me</title>
</svelte:head>

{#if allowed}
	{@render children()}
{:else}
	<p class="boot">Завантаження…</p>
{/if}

<style>
	:global(body) {
		margin: 0;
		font: 16px/1.55 system-ui, -apple-system, 'Segoe UI', sans-serif;
	}
	:global(main) {
		max-width: 40rem;
		margin: 0 auto;
		padding: 32px 16px;
	}
	.boot {
		text-align: center;
		padding: 32px 16px;
		opacity: 0.6;
	}
</style>
