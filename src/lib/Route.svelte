<script lang="ts">
	// Прогрес як маршрут на вершину: від старту до прапора «№1».
	// Табори — межі кроків (за кількістю питань до них), «ти тут» — частка заповнених відповідей.
	// Малюється кольором тексту плашки (--on-hero); пройдене й «ти тут» — помаранчевим (--answer: контрастний на плашці).
	import { resolve } from '$app/paths';
	import { PLAN, formatDay, partStatus } from '#lib/plan.js';
	import type { Answers } from '#lib/plan.js';

	let { answers, startDate = '' }: { answers: Answers; startDate?: string } = $props();

	const counts = PLAN.map((s) => s.parts.reduce((n, p) => n + partStatus(p, {}).total, 0));
	const total = counts.reduce((a, b) => a + b, 0);
	const camps = counts.map((_, i) => counts.slice(0, i + 1).reduce((a, b) => a + b, 0) / total);

	const doneBy = $derived(PLAN.map((s) => s.parts.reduce((n, p) => n + partStatus(p, answers).done, 0)));
	const done = $derived(doneBy.reduce((a, b) => a + b, 0));
	const share = $derived(done / total);

	let points = $state<{ x: number; y: number }[]>([]);
	let here = $state({ x: 0, y: 0 });

	// Позиції таборів і «ти тут» беремо з самої кривої
	function measure(path: SVGPathElement) {
		const len = path.getTotalLength();
		const at = (f: number) => {
			const p = path.getPointAtLength(f * len);
			return { x: p.x, y: p.y };
		};
		points = camps.map(at);
		here = at(share);
	}

	const ROUTE = 'M40 352 C 120 344, 168 316, 208 290 S 280 252, 298 214 S 326 158, 368 138 S 428 96, 452 52';
</script>

<div class="route">
	<p class="share"><b>{Math.round(share * 100)}%</b> шляху, {done} з {total} відповідей</p>

	<svg viewBox="0 0 520 390" role="img" aria-label="Пройдено {Math.round(share * 100)}% шляху до №1">
		<g class="topo">
			<path d="M10 372 C 90 300, 140 330, 200 268 S 300 196, 330 146 S 400 56, 444 34 S 504 66, 512 118" />
			<path d="M36 384 C 110 322, 160 350, 222 288 S 316 224, 346 174 S 406 94, 444 76 S 488 98, 502 140" />
			<path d="M70 390 C 140 344, 186 368, 242 312 S 332 250, 362 204 S 412 134, 444 116 S 474 130, 490 164" />
			<path d="M118 392 C 172 366, 212 382, 264 336 S 348 278, 378 238 S 418 174, 444 158 S 464 166, 476 190" />
			<path d="M170 394 C 216 380, 244 390, 288 360 S 362 306, 392 270 S 424 214, 444 204 S 456 210, 464 222" />
		</g>

		<path class="ahead" d={ROUTE} {@attach measure} />
		<path class="behind" d={ROUTE} pathLength="1" stroke-dasharray="{share} 1" />

		<circle class="start" cx="40" cy="352" r="5" />
		<text class="label" x="40" y="378">Старт{startDate ? `, ${formatDay(startDate)}` : ''}</text>

		{#each points as p, i (i)}
			{@const reached = doneBy[i] === counts[i]}
			<!-- Табір веде до кроку в бланку, і з бланка, і з карти -->
			<a href="{resolve('/')}#step-{PLAN[i].n}" aria-label="Крок {PLAN[i].n}. {PLAN[i].title}">
				<circle class={['camp', { reached }]} cx={p.x} cy={p.y} r="6" />
				<text class="num" x={p.x - 16} y={p.y - 8}>{PLAN[i].n}</text>
			</a>
		{/each}

		{#if points.length}
			<circle class="here" cx={here.x} cy={here.y} r="9" />
			<text class="label" x={here.x + 16} y={here.y + 5}>ти тут</text>
		{/if}

		<path class="pole" d="M452 52 V 10" />
		<path class="flag" d="M452 10 L 482 18 L 452 26 Z" />
		<text class="summit" x="464" y="48">№1</text>
	</svg>
</div>

<style>
	.route {
		color: var(--on-hero);
	}
	.share {
		margin: 0 0 8px;
		font-size: 1rem;
	}
	.share b {
		display: block;
		font-size: 4.5rem;
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.05em;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	.topo path {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.2;
		opacity: 0.16;
	}
	.ahead {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-dasharray: 6 6;
		opacity: 0.5;
	}
	.behind {
		fill: none;
		stroke: var(--answer);
		stroke-width: 4;
		stroke-linecap: round;
	}
	.start {
		fill: currentColor;
	}
	.camp {
		fill: var(--hero);
		stroke: currentColor;
		stroke-width: 2;
	}
	.camp.reached {
		fill: var(--accent);
		stroke: var(--accent);
	}
	a:hover .camp {
		stroke-width: 4;
	}
	.here {
		fill: var(--answer);
		stroke: var(--hero);
		stroke-width: 4;
	}
	text {
		fill: currentColor;
		font-family: var(--font);
	}
	.label {
		font-size: 14px;
		font-weight: 500;
	}
	.num {
		font-size: 14px;
		font-weight: 800;
	}
	.pole {
		stroke: currentColor;
		stroke-width: 2;
	}
	.flag {
		fill: var(--flag);
	}
	.summit {
		font-size: 20px;
		font-weight: 800;
	}
</style>
