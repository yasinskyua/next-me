<script lang="ts">
	// ПРОТОТИП, варіант C: зміст зліва зі статусом кожного розділу, праворуч — один розділ.
	// На вузькому екрані зміст згортається у випадний список.
	import type { Snippet } from 'svelte';
	import { PLAN } from '#lib/plan.js';
	import type { Answers, Field } from '#lib/plan.js';
	import { partStatus } from './filled.js';

	let { field, answers }: { field: Snippet<[Field]>; answers: Answers } = $props();

	const parts = PLAN.flatMap((step) => step.parts.map((part) => ({ step, part })));
	let i = $state(0);
	let hideDone = $state(false);
	const cur = $derived(parts[i]);
	const stats = $derived(parts.map((p) => partStatus(p.part, answers)));
	const done = $derived(stats.reduce((n, s) => n + s.done, 0));
	const total = $derived(stats.reduce((n, s) => n + s.total, 0));

	const title = (k: number) => `${parts[k].part.num ? `${parts[k].part.num}. ` : ''}${parts[k].part.title}`;
	const complete = (k: number) => stats[k].done === stats[k].total;

	function open(k: number) {
		i = k;
		scrollTo({ top: 0 });
	}

	function nextEmpty() {
		const after = parts.findIndex((_, k) => k > i && !complete(k));
		const any = parts.findIndex((_, k) => !complete(k));
		open(after >= 0 ? after : Math.max(any, 0));
	}
</script>

<div class="layout">
	<aside>
		<p class="total">Заповнено <b>{done}</b> з {total}</p>
		<progress value={done} max={total}></progress>

		<label class="hide"><input type="checkbox" bind:checked={hideDone} /> Сховати заповнені</label>

		<ul class="toc">
			{#each parts as p, k (p.part)}
				{#if k === 0 || parts[k - 1].step !== p.step}
					<li class="step">Крок {p.step.n}. {p.step.title}</li>
				{/if}
				{#if !(hideDone && complete(k)) || k === i}
					<li>
						<button type="button" aria-current={k === i ? 'true' : undefined} onclick={() => open(k)}>
							<span>{title(k)}</span>
							<span class={['badge', { ok: complete(k) }]}>{complete(k) ? '✓' : `${stats[k].done}/${stats[k].total}`}</span>
						</button>
					</li>
				{/if}
			{/each}
		</ul>

		<select class="mobile" aria-label="Розділ" value={i} onchange={(e) => open(Number(e.currentTarget.value))}>
			{#each parts as p, k (p.part)}
				<option value={k}>{complete(k) ? '✓' : `${stats[k].done}/${stats[k].total}`} · {title(k)}</option>
			{/each}
		</select>
	</aside>

	<main>
		<p class="crumb">Крок {cur.step.n} · {cur.step.title}</p>
		<h1>{title(i)}</h1>

		{#each cur.part.fields as f (f.type === 'note' ? f.text : f.id)}
			{@render field(f)}
		{/each}

		<button type="button" class="next" onclick={nextEmpty}>Наступний незаповнений розділ →</button>
	</main>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: 17rem minmax(0, 1fr);
		gap: 32px;
		max-width: 64rem;
		margin: 0 auto;
		padding: 0 16px;
	}
	.layout main {
		margin: 0;
		padding: 24px 0 96px;
	}
	aside {
		position: sticky;
		top: 49px;
		align-self: start;
		max-height: calc(100vh - 49px);
		overflow-y: auto;
		padding: 24px 0;
	}
	.total {
		margin: 0 0 4px;
	}
	progress {
		width: 100%;
	}
	.hide {
		display: flex;
		gap: 6px;
		margin: 8px 0 12px;
		font-size: 0.875rem;
	}
	.toc {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.step {
		margin: 16px 0 4px;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.6;
	}
	.toc button {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		width: 100%;
		padding: 6px 8px;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 0.9375rem;
		text-align: left;
		cursor: pointer;
	}
	.toc button:hover {
		background: color-mix(in srgb, CanvasText 6%, transparent);
	}
	.toc button[aria-current] {
		background: color-mix(in srgb, CanvasText 12%, transparent);
		font-weight: 600;
	}
	.badge {
		flex: none;
		font-size: 0.8125rem;
		opacity: 0.6;
	}
	.badge.ok {
		color: #2e7d32;
		opacity: 1;
	}
	.mobile {
		display: none;
	}
	.crumb {
		margin: 0;
		font-size: 0.875rem;
		opacity: 0.6;
	}
	h1 {
		margin-top: 4px;
	}
	.next {
		margin-top: 40px;
		padding: 12px 20px;
		border: 0;
		border-radius: 8px;
		background: CanvasText;
		color: Canvas;
		font: inherit;
		cursor: pointer;
	}
	@media (max-width: 760px) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
			gap: 0;
		}
		aside {
			position: static;
			max-height: none;
			padding-bottom: 0;
		}
		.toc,
		.hide {
			display: none;
		}
		.mobile {
			display: block;
			width: 100%;
			margin-top: 12px;
			font: inherit;
		}
	}
</style>
