<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import '../app.css';
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
	.boot {
		padding: 40px 16px;
		text-align: center;
		color: var(--muted);
		font-family: var(--font);
	}
</style>
