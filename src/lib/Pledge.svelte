<script lang="ts">
	// Заява «Я, …, хочу до … стати №1 в …» великим кеглем на плашці.
	// Текст бланка напівпрозорий, твої слова — повним кольором, порожні місця — пропуски.
	// Скоригована заява (stmt2) має перевагу над першою.
	import { formatDay } from '#lib/plan.js';
	import type { Answers } from '#lib/plan.js';

	let { answers }: { answers: Answers } = $props();

	const s = $derived(
		[answers.stmt2, answers.stmt].find((x) => x && (x.name?.trim() || x.date || x.domain?.trim())) ?? {}
	);
	const name = $derived(s.name?.trim() ?? '');
	const domain = $derived(s.domain?.trim() ?? '');
</script>

<h1 class="pledge">
	<span class="t">Я,</span>
	{#if name}{name}{:else}<span class="blank"></span>{/if}<span class="t">, хочу до</span>
	{#if s.date}{formatDay(s.date)}{:else}<span class="blank"></span>{/if}
	<span class="t">стати №1 в</span>
	{#if domain}{domain}{:else}<span class="blank"></span>{/if}<span class="t">.</span>
</h1>

<style>
	.pledge {
		color: var(--on-hero);
		font-size: clamp(2.5rem, 5.4vw, 5rem);
		line-height: 0.98;
		letter-spacing: -0.045em;
	}
	.t {
		opacity: 0.6;
	}
	.blank {
		display: inline-block;
		width: 2.4em;
		height: 0.8em;
		border-bottom: 0.07em solid currentColor;
		opacity: 0.55;
	}
	@media print {
		.pledge {
			color: #000;
			font-size: 2.25rem;
		}
	}
</style>
