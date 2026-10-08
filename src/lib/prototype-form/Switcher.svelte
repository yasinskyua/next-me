<script lang="ts">
	// ПРОТОТИП: перемикач варіантів бланка (?variant=). Показується лише в dev.
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { variants, current }: { variants: { key: string; name: string }[]; current: string } = $props();

	const idx = $derived(Math.max(0, variants.findIndex((v) => v.key === current)));

	function show(step: number) {
		const url = new URL(page.url.href);
		url.searchParams.set('variant', variants[(idx + step + variants.length) % variants.length].key);
		goto(url, { replace: true, reset: false });
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
		if (e.key === 'ArrowLeft') show(-1);
		if (e.key === 'ArrowRight') show(1);
	}
</script>

<svelte:window {onkeydown} />

<div class="switcher" role="toolbar" aria-label="Варіанти прототипу">
	<button type="button" onclick={() => show(-1)} aria-label="Попередній варіант">←</button>
	<span>{variants[idx].key} · {variants[idx].name}</span>
	<button type="button" onclick={() => show(1)} aria-label="Наступний варіант">→</button>
</div>

<style>
	.switcher {
		position: fixed;
		bottom: 16px;
		left: 50%;
		translate: -50% 0;
		z-index: 100;
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 6px 8px;
		border-radius: 999px;
		background: #111;
		color: #fff;
		font: 600 14px/1 system-ui, sans-serif;
		box-shadow: 0 6px 24px rgb(0 0 0 / 0.35);
		white-space: nowrap;
	}
	button {
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: 50%;
		background: #333;
		color: #fff;
		font: inherit;
		cursor: pointer;
	}
	button:hover {
		background: #555;
	}
</style>
