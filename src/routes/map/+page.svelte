<script lang="ts">
	import { resolve } from '$app/paths';
	import Pledge from '#lib/Pledge.svelte';
	import Route from '#lib/Route.svelte';
	import ThemeToggle from '#lib/ThemeToggle.svelte';
	import { formatDay } from '#lib/plan.js';
	import type { Answers } from '#lib/plan.js';
	import { loadAnswers } from '#lib/supabase.js';

	// План-карта: з бланка лише зобов'язання (мета, що виправити, що розвивати, що зробити).
	// Діагностика на кшталт «так/ні» і самооцінок без пріоритету лишається в бланку.
	const loading = loadAnswers();

	type Block = { title: string; tags?: string[]; text?: string; items?: string[] };
	type Section = { step: number; title: string; blocks: Block[] };

	const txt = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
	const list = (v: unknown) => (Array.isArray(v) ? v.map(txt).filter(Boolean) : []);

	// Пункти таблиці з пріоритетом A, спершу найменш розвинені
	const priorityA = (m: Answers) =>
		Object.entries(m)
			.filter(([, row]) => row?.prio === 'A')
			.map(([key, row]) => ({ name: key.replace(' / ', ': '), score: txt(row.score) }))
			.sort((x, y) => (x.score || '6').localeCompare(y.score || '6'))
			.map(({ name, score }) => (score ? `${name} — ${score}/5` : name));

	function sections(a: Answers): Section[] {
		const all: Section[] = [
			{ step: 2, title: 'Що виправити', blocks: [
				{ title: 'Сильні сторони', text: txt(a.s_more) },
				{ title: 'Слабкі сторони', text: txt(a.w_fix) },
				{ title: 'Початкові дані', tags: list(a.innate), text: txt(a.innate_fix) },
				{ title: '«Вітаю, я…»', tags: list(a.intro), text: txt(a.intro_fix) },
				{ title: 'Імідж', tags: list(a.look), text: txt(a.look_fix) },
				{ title: 'Підтримка ближнього кола', items: list(a.support) },
				{ title: 'Наставник', text: [txt(a.mentor_who), txt(a.mentor_better)].filter(Boolean).join('\n') },
				{ title: 'Наступний етап кар’єри', tags: list([a.cycle_next]), text: txt(a.cycle_prep) },
			] },
			{ step: 3, title: 'Розвиток', blocks: [
				{ title: 'Навички з пріоритетом A', items: priorityA(a.skills) },
				{ title: 'Як навчатися', tags: list(a.learn) },
				{ title: 'Теми за спеціальністю', text: txt(a.learn_main) },
				{ title: 'Теми за суміжними спеціальностями', text: txt(a.learn_adj) },
			] },
			{ step: 4, title: 'Найближчий рік', blocks: [
				{ title: 'Чим пишатися', items: list(a.pride_1y) },
				{ title: 'Які нагороди отримати', items: list(a.awards_1y) },
			] },
			{ step: 5, title: 'Просування', blocks: [
				{ title: 'Бренд: пріоритет A', items: priorityA(a.brand) },
				{ title: 'Де світитися: пріоритет A', items: priorityA(a.shine) },
				{ title: 'Що зробити для інших', items: list(a.give_next) },
				{ title: 'Правила життя', text: txt(a.rules_text) },
			] },
		];
		return all.map((s) => ({ ...s, blocks: s.blocks.filter((b) => b.tags?.length || b.text || b.items?.length) }));
	}
</script>

<svelte:head>
	<title>План-карта · Next Me</title>
</svelte:head>

<header>
	<a class="brand" href={resolve('/')}>План перемоги</a>
	<a class="link" href={resolve('/')}>До бланка</a>
	<button type="button" class="link" onclick={() => window.print()}>Друкувати</button>
	<ThemeToggle />
</header>

{#await loading}
	<p class="boot">Завантаження…</p>
{:then a}
	<section class="hero">
		<div class="hero-in">
			<div>
				<Pledge answers={a} />
				{#if txt(a.goal)}<p class="goal">{txt(a.goal)}</p>{/if}
				{#if a.started === 'так'}
					<p class="start">Уже на шляху до №1.</p>
				{:else if a.start_date}
					<p class="start">Старт {formatDay(a.start_date)}</p>
				{/if}
			</div>
			<div class="route"><Route answers={a} startDate={a.start_date} /></div>
		</div>
	</section>

	<main>
		{#each sections(a) as s (s.step)}
			<section class="step">
				<h2><span class="sn">{s.step}</span>{s.title}</h2>
				{#each s.blocks as b (b.title)}
					<div class="row">
						<h3>{b.title}</h3>
						<div>
							{#if b.tags?.length}<p class="tags">{b.tags.join(', ')}</p>{/if}
							{#if b.text}<p class="text">{b.text}</p>{/if}
							{#if b.items?.length}
								<ul>
									<!-- Пункти можуть повторюватися, тож ключ — позиція -->
									{#each b.items as item, i (i)}<li>{item}</li>{/each}
								</ul>
							{/if}
						</div>
					</div>
				{:else}
					<p class="empty">Ще порожньо. <a href="{resolve('/')}#step-{s.step}">Заповнити крок {s.step}</a></p>
				{/each}
			</section>
		{/each}
	</main>
{:catch error}
	<main><p role="alert">Не вдалося завантажити план: {error.message}</p></main>
{/await}

<style>
	header {
		display: flex;
		gap: 24px;
		align-items: center;
		box-sizing: border-box;
		height: var(--header);
		padding: 0 24px;
		border-bottom: 1px solid var(--hairline);
		font-size: 0.9375rem;
	}
	.brand {
		margin-right: auto;
		font-weight: 800;
		letter-spacing: -0.02em;
		text-decoration: none;
	}
	header .link {
		text-decoration: none;
	}
	.boot {
		padding: 40px 24px;
		color: var(--muted);
	}

	.hero {
		background: var(--hero);
		color: var(--on-hero);
	}
	.hero-in {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
		gap: 56px;
		align-items: end;
		max-width: 76rem;
		margin: 0 auto;
		padding: 64px 24px 48px;
	}
	.goal {
		max-width: 34em;
		margin: 28px 0 0;
		font-size: 1.25rem;
		font-weight: 400;
	}
	.start {
		margin: 16px 0 0;
		font-weight: 500;
	}

	main {
		max-width: 60rem;
	}
	.step {
		margin-top: 72px;
	}
	.step:first-child {
		margin-top: 24px;
	}
	h2 {
		display: flex;
		gap: 20px;
		align-items: baseline;
		padding-bottom: 16px;
		border-bottom: 3px solid var(--fg);
		font-size: 2.75rem;
	}
	.sn {
		color: var(--accent);
		font-size: 7.5rem;
		line-height: 0.75;
		letter-spacing: -0.08em;
	}
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
		gap: 8px 32px;
		padding: 16px 0;
		border-bottom: 1px solid var(--hairline);
	}
	h3 {
		font-size: 1.0625rem;
		font-weight: 500;
		line-height: 1.4;
		letter-spacing: 0;
	}
	.tags {
		margin: 0 0 6px;
		color: var(--muted);
		font-size: 0.9375rem;
	}
	.text {
		margin: 0;
		color: var(--answer);
		font-weight: 500;
		white-space: pre-line;
	}
	ul {
		margin: 0;
		padding-left: 1.2em;
		color: var(--answer);
		font-weight: 500;
	}
	li + li {
		margin-top: 4px;
	}
	.empty {
		margin: 16px 0 0;
		color: var(--muted);
	}

	@media (max-width: 900px) {
		.hero-in {
			grid-template-columns: minmax(0, 1fr);
			gap: 32px;
			padding: 40px 16px 32px;
		}
		.row {
			grid-template-columns: minmax(0, 1fr);
		}
		h2 {
			font-size: 2rem;
		}
		.sn {
			font-size: 5rem;
		}
	}

	/* Друк: без шапки, маршруту й фону; заява — чорним */
	@media print {
		header,
		.route,
		.empty {
			display: none;
		}
		.hero {
			background: none;
			color: #000;
		}
		.hero-in {
			display: block;
			padding: 0 24px;
		}
		.text,
		ul {
			color: #000;
		}
		h2 {
			break-after: avoid;
		}
		.row {
			break-inside: avoid;
		}
	}
</style>
