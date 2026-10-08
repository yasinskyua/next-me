<script lang="ts">
	// ПРОТОТИП, варіант B: майстер — один розділ на екран, «Назад / Далі», кружечки кроків угорі
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { PLAN } from '#lib/plan.js';
	import type { Answers, Field } from '#lib/plan.js';
	import { partStatus } from './filled.js';

	let { field, answers }: { field: Snippet<[Field]>; answers: Answers } = $props();

	const parts = PLAN.flatMap((step) => step.parts.map((part) => ({ step, part })));
	let i = $state(0);
	const cur = $derived(parts[i]);
	const status = $derived(partStatus(cur.part, answers));

	function go(to: number) {
		i = to;
		scrollTo({ top: 0 });
	}
</script>

<main>
	<ol class="steps">
		{#each PLAN as step (step.n)}
			<li>
				<button
					type="button"
					class={{ active: step.n === cur.step.n, past: step.n < cur.step.n }}
					aria-label="Крок {step.n}. {step.title}"
					onclick={() => go(parts.findIndex((p) => p.step === step))}>{step.n}</button
				>
				<span>{step.title}</span>
			</li>
		{/each}
	</ol>

	<progress value={i + 1} max={parts.length}></progress>
	<p class="meta">Розділ {i + 1} з {parts.length} · заповнено {status.done} з {status.total}</p>

	<h1>{cur.part.num ? `${cur.part.num}. ` : ''}{cur.part.title}</h1>

	{#each cur.part.fields as f (f.type === 'note' ? f.text : f.id)}
		{@render field(f)}
	{/each}

	<nav class="pager">
		<button type="button" disabled={i === 0} onclick={() => go(i - 1)}>← Назад</button>
		{#if i < parts.length - 1}
			<button type="button" class="primary" onclick={() => go(i + 1)}>Далі →</button>
		{:else}
			<a class="primary" href={resolve('/map')}>Готово: до план-карти</a>
		{/if}
	</nav>
</main>

<style>
	.steps {
		display: flex;
		justify-content: space-between;
		list-style: none;
		margin: 0 0 16px;
		padding: 0;
	}
	.steps li {
		display: grid;
		justify-items: center;
		gap: 4px;
		font-size: 0.75rem;
		opacity: 0.8;
	}
	.steps button {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 2px solid currentColor;
		background: transparent;
		font: 600 0.875rem/1 system-ui, sans-serif;
		cursor: pointer;
	}
	.steps .past {
		opacity: 0.5;
	}
	.steps .active {
		background: CanvasText;
		color: Canvas;
		border-color: CanvasText;
	}
	progress {
		width: 100%;
	}
	.meta {
		margin: 4px 0 0;
		font-size: 0.875rem;
		opacity: 0.7;
	}
	h1 {
		margin-top: 24px;
	}
	.pager {
		display: flex;
		justify-content: space-between;
		margin: 40px 0 80px;
	}
	.pager button,
	.pager a {
		padding: 12px 20px;
		font: inherit;
		border-radius: 8px;
		border: 1px solid currentColor;
		background: transparent;
		color: inherit;
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
</style>
