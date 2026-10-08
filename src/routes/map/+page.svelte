<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Answers } from '#lib/plan.js';
	import { loadAnswers } from '#lib/supabase.js';

	// План-карта: з бланка лише зобов'язання (мета, що виправити, що розвивати, що зробити).
	// Діагностика на кшталт «так/ні» і самооцінок без пріоритету лишається в бланку.
	const loading = loadAnswers();

	type Block = { title: string; tags?: string[]; text?: string; items?: string[] };
	type Section = { step: number; title: string; blocks: Block[] };

	const txt = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
	const list = (v: unknown) => (Array.isArray(v) ? v.map(txt).filter(Boolean) : []);
	const day = (d: string) =>
		new Date(`${d}T00:00`).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

	function goal(a: Answers) {
		const s = [a.stmt2, a.stmt].find((s) => txt(s.name) || txt(s.date) || txt(s.domain));
		if (!s) return '';
		const name = txt(s.name);
		const domain = txt(s.domain);
		return `Я${name ? `, ${name},` : ''} хочу${s.date ? ` до ${day(s.date)}` : ''} стати №1${domain ? ` в ${domain}` : ''}.`;
	}

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

<main>
	<nav class="bar">
		<a href={resolve('/')}>← Бланк</a>
		<button type="button" onclick={() => window.print()}>Друкувати</button>
	</nav>

	<h1>План-карта</h1>

	{#await loading}
		<p>Завантаження…</p>
	{:then a}
		{@const statement = goal(a)}
		<section>
			<h2>Мета</h2>
			{#if statement}<p class="goal">{statement}</p>{/if}
			{#if txt(a.goal)}<p class="text">{txt(a.goal)}</p>{/if}
			{#if a.started === 'так'}
				<p>Уже на шляху до №1.</p>
			{:else if a.start_date}
				<p>Старт: <b>{day(a.start_date)}</b>.</p>
			{/if}
			{#if !statement && !txt(a.goal)}{@render empty(1)}{/if}
		</section>

		{#each sections(a) as s (s.step)}
			<section>
				<h2>{s.title}</h2>
				{#each s.blocks as b (b.title)}
					<h3>{b.title}</h3>
					{#if b.tags?.length}<p class="tags">{b.tags.join(' · ')}</p>{/if}
					{#if b.text}<p class="text">{b.text}</p>{/if}
					{#if b.items?.length}
						<ul>
							<!-- Пункти можуть повторюватися, тож ключ — позиція -->
							{#each b.items as item, i (i)}<li>{item}</li>{/each}
						</ul>
					{/if}
				{:else}
					{@render empty(s.step)}
				{/each}
			</section>
		{/each}
	{:catch error}
		<p role="alert">Не вдалося завантажити план: {error.message}</p>
	{/await}
</main>

{#snippet empty(step: number)}
	<p class="empty">Ще порожньо. <a href="{resolve('/')}#step-{step}">Заповнити крок {step}</a></p>
{/snippet}

<style>
	.bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	h2 {
		margin-top: 40px;
		padding-bottom: 4px;
		border-bottom: 1px solid color-mix(in srgb, CanvasText 15%, transparent);
	}
	h3 {
		margin: 20px 0 4px;
		font-size: 1rem;
	}
	.goal {
		font-size: 1.375rem;
		font-weight: 600;
		line-height: 1.35;
	}
	.text {
		margin: 0;
		white-space: pre-line;
	}
	.tags {
		margin: 0 0 4px;
		font-size: 0.875rem;
		opacity: 0.7;
	}
	ul {
		margin: 0;
		padding-left: 1.25em;
	}
	.empty {
		opacity: 0.6;
	}
	@media print {
		.bar,
		.empty {
			display: none;
		}
		h2 {
			break-after: avoid;
		}
	}
</style>
