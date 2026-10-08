<script lang="ts">
	// ПРОТОТИП, варіант D: одне питання на екран, великий шрифт.
	// Enter у рядку або ⌘/Ctrl+Enter будь-де — далі. Примітка показується разом зі своїм питанням.
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { PLAN } from '#lib/plan.js';
	import type { Answers, Field } from '#lib/plan.js';

	let { field }: { field: Snippet<[Field]>; answers: Answers } = $props();

	const items = PLAN.flatMap((step) =>
		step.parts.flatMap((part) =>
			part.fields.flatMap((f, j) => {
				if (f.type === 'note') return [];
				const next = part.fields[j + 1];
				return [{ step, part, f, note: next?.type === 'note' ? next : undefined }];
			})
		)
	);
	let i = $state(0);
	const cur = $derived(items[i]);

	const go = (to: number) => (i = Math.max(0, Math.min(items.length - 1, to)));

	function onkeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		const t = e.target as HTMLInputElement;
		const line = t.tagName === 'INPUT' && !['checkbox', 'radio'].includes(t.type);
		if (e.metaKey || e.ctrlKey || line) {
			e.preventDefault();
			go(i + 1);
		}
	}

	const focusFirst = (el: HTMLElement) => {
		el.querySelector<HTMLElement>('input, textarea, select')?.focus();
	};
</script>

<svelte:window {onkeydown} />

<progress class="bar" value={i + 1} max={items.length}></progress>

<main>
	<p class="crumb">
		Крок {cur.step.n} · {cur.part.num ? `${cur.part.num}. ` : ''}{cur.part.title}
		<span>· питання {i + 1} з {items.length}</span>
	</p>

	{#key i}
		<div class="screen" {@attach focusFirst}>
			{@render field(cur.f)}
			{#if cur.note}{@render field(cur.note)}{/if}
		</div>
	{/key}

	<nav class="pager">
		<button type="button" disabled={i === 0} onclick={() => go(i - 1)}>←</button>
		{#if i < items.length - 1}
			<button type="button" class="primary" onclick={() => go(i + 1)}>Далі</button>
		{:else}
			<a class="primary" href={resolve('/map')}>До план-карти</a>
		{/if}
		<span class="hint">Enter ↵</span>
	</nav>
</main>

<style>
	.bar {
		position: fixed;
		top: 49px;
		left: 0;
		width: 100%;
		height: 4px;
		appearance: none;
		border: 0;
	}
	main {
		min-height: calc(100vh - 160px);
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.crumb {
		font-size: 0.875rem;
		opacity: 0.6;
	}
	.screen :global(.q) {
		margin: 0 0 20px;
		font-size: 1.75rem;
		line-height: 1.25;
	}
	.screen :global(textarea),
	.screen :global(input),
	.screen :global(.option) {
		font-size: 1.125rem;
	}
	.screen :global(.option) {
		padding: 6px 0;
	}
	.pager {
		display: flex;
		gap: 12px;
		align-items: center;
		margin-top: 32px;
	}
	.pager button,
	.pager a {
		padding: 12px 22px;
		border: 1px solid currentColor;
		border-radius: 8px;
		background: transparent;
		color: inherit;
		font: inherit;
		text-decoration: none;
		cursor: pointer;
	}
	.pager .primary {
		background: CanvasText;
		color: Canvas;
	}
	.pager button:disabled {
		opacity: 0.3;
		cursor: default;
	}
	.hint {
		font-size: 0.8125rem;
		opacity: 0.5;
	}
</style>
