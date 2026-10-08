<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Pledge from '#lib/Pledge.svelte';
	import Route from '#lib/Route.svelte';
	import { auth, signOut } from '#lib/auth.svelte.js';
	import { INTRO, PLAN, SCALE, STATEMENT, SWOT, matrixKey, partStatus } from '#lib/plan.js';
	import type { Answers, Field, Part, Step } from '#lib/plan.js';
	import { loadAnswers, saveAnswers } from '#lib/supabase.js';

	let answers = $state<Answers>({});
	let status = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let problem = $state('');

	// Форма з'являється лише після завантаження: інакше автозбереження затерло б базу порожнім бланком
	const loading = loadAnswers().then((loaded) => {
		answers = loaded;
	});

	// Автозбереження після паузи в наборі. Правки, зроблені під час запису, підуть наступним колом.
	let edits = 0;
	let saved = 0;
	let writing = false;
	let timer: ReturnType<typeof setTimeout> | undefined;

	function edited() {
		edits++;
		status = 'saving';
		clearTimeout(timer);
		timer = setTimeout(save, 800);
	}

	async function save() {
		clearTimeout(timer);
		if (writing || !auth.session) return;
		writing = true;
		status = 'saving';
		while (saved < edits) {
			const version = edits;
			const { error } = await saveAnswers(auth.session.user.id, $state.snapshot(answers));
			if (error) {
				status = 'error';
				problem = error.message;
				writing = false;
				return;
			}
			saved = version;
		}
		writing = false;
		status = 'saved';
	}

	// Перед виходом чи переходом на карту дописуємо незбережене
	async function flush() {
		if (saved < edits) await save();
		return saved === edits;
	}

	async function toMap(e: MouseEvent) {
		if (saved === edits) return;
		e.preventDefault();
		if (await flush()) goto(resolve('/map'));
	}

	const unsaved = () => status === 'saving' || status === 'error';

	// --- Орієнтація: розділи з якорями, статус заповнення, де ти зараз ---
	const partId = (step: Step, part: Part) => `part-${part.num ?? step.n}`;
	const parts = PLAN.flatMap((step) => step.parts.map((part) => ({ step, part, id: partId(step, part) })));
	const stepStatus = (step: Step) =>
		step.parts.reduce(
			(a, p) => {
				const s = partStatus(p, answers);
				return { done: a.done + s.done, total: a.total + s.total };
			},
			{ done: 0, total: 0 }
		);

	let current = $state(parts[0].id);
	const here = $derived(parts.find((p) => p.id === current) ?? parts[0]);
	let rail = $state<HTMLElement>();
	let frame = 0;

	// Поточний розділ — останній, чий заголовок уже під шапкою
	function spy() {
		let id = parts[0].id;
		for (const p of parts) {
			const el = document.getElementById(p.id);
			if (!el || el.getBoundingClientRect().top > 160) break;
			id = p.id;
		}
		if (id === current) return;
		current = id;
		// Тримаємо поточний розділ у полі зору змісту
		const item = rail?.querySelector<HTMLElement>(`[data-part="${id}"]`);
		if (rail && item && (item.offsetTop < rail.scrollTop || item.offsetTop + item.offsetHeight > rail.scrollTop + rail.clientHeight))
			rail.scrollTop = item.offsetTop - rail.clientHeight / 3;
	}

	// Бланк з'являється після завантаження, тож до якоря з адреси (/#step-2 з план-карти) доводимо самі
	function arrived() {
		if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
		spy();
	}

	const onscroll = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(spy);
	};

	// На телефоні зміст — спливна панель: після переходу ховаємо її
	const closeRail = () => rail?.matches(':popover-open') && rail.hidePopover();
</script>

<svelte:window onbeforeunload={(e) => unsaved() && e.preventDefault()} {onscroll} />
<!-- На телефоні вкладку можуть вивантажити без beforeunload: зберігаємо, щойно вона ховається -->
<svelte:document onvisibilitychange={() => document.hidden && saved < edits && save()} />

<svelte:head>
	<title>План перемоги · Next Me</title>
</svelte:head>

<header>
	<a class="brand" href="#top">План перемоги</a>
	<button type="button" class="where" popovertarget="rail">
		<span class="where-n">{here.part.num ?? here.step.n}</span>
		{here.part.title}
	</button>
	<span role="status" class={['status', status]}>
		{#if status === 'saving'}Зберігаю…{:else if status === 'saved'}Збережено{:else if status === 'error'}Не збережено{/if}
	</span>
	{#if status === 'error'}
		<button type="button" class="link" onclick={save}>Повторити</button>
	{/if}
	<a class="link" href={resolve('/map')} onclick={toMap}>План-карта</a>
	<button type="button" class="link" title={auth.session?.user.email} onclick={async () => (await flush()) && signOut()}>Вийти</button>
</header>

{#await loading}
	<p class="boot">Завантаження…</p>
{:then}
	<section class="hero" id="top">
		<div class="hero-in">
			<div>
				<Pledge {answers} />
				<a class="edit" href="#part-2.1">Змінити заяву</a>
			</div>
			<Route {answers} startDate={answers.start_date} />
		</div>
	</section>

	<div class="body">
		<nav id="rail" class="rail" popover aria-label="Кроки й розділи" bind:this={rail}>
			<ol class="trail">
				{#each PLAN as step (step.n)}
					{@const st = stepStatus(step)}
					<li>
						<a class={['leg', { on: here.step === step }]} href="#step-{step.n}" onclick={closeRail}>
							<span class="pie big" style:--p={st.done / st.total}></span>
							<span class="leg-n">{step.n}</span>
							<span class="leg-t">{step.title}</span>
						</a>
						<ol>
							{#each step.parts as part (part.title)}
								{@const s = partStatus(part, answers)}
								{@const id = partId(step, part)}
								<li>
									<a href="#{id}" data-part={id} aria-current={current === id ? 'location' : undefined} onclick={closeRail}>
										<span class="pie" style:--p={s.done / s.total}></span>
										<span class="part-t">{part.num ? `${part.num} ` : ''}{part.title}</span>
										<span class="count">{s.done}/{s.total}</span>
									</a>
								</li>
							{/each}
						</ol>
					</li>
				{/each}
			</ol>
			<p class="summit">№1</p>
		</nav>

		<main>
			{#if status === 'error'}
				<p role="alert">Не вдалося зберегти: {problem}. Відповіді лишаються на сторінці, натисни «Повторити».</p>
			{/if}
			<p class="intro">{INTRO}</p>

			<form oninput={edited} onsubmit={(e) => e.preventDefault()} {@attach arrived}>
				{#each PLAN as step (step.n)}
					<section class="step" id="step-{step.n}">
						<h2><span class="sn">{step.n}</span>{step.title}</h2>
						{#each step.parts as part (part.title)}
							{@const s = partStatus(part, answers)}
							<h3 id={partId(step, part)}>
								{#if part.num}<span class="pn">{part.num}</span>{/if}
								{part.title}
								<span class="pc">{s.done} з {s.total}</span>
							</h3>
							{#each part.fields as f (f.type === 'note' ? f.text : f.id)}
								{@render field(f)}
							{/each}
						{/each}
					</section>
				{/each}
			</form>

			<a class="to-map" href={resolve('/map')} onclick={toMap}>Переглянути план-карту</a>
		</main>
	</div>
{:catch error}
	<main><p role="alert">Не вдалося завантажити бланк: {error.message}</p></main>
{/await}

{#snippet field(f: Field)}
	{#if f.type === 'note'}
		<p class="note">{f.text}</p>
	{:else if f.type === 'text'}
		<div class="row">
			<label class="q" for={f.id}>{f.label}</label>
			<textarea id={f.id} class="answer" rows={f.rows} bind:value={answers[f.id]}></textarea>
		</div>
	{:else if f.type === 'date'}
		<div class="row">
			<label class="q" for={f.id}>{f.label}</label>
			<input id={f.id} class="answer date" type="date" bind:value={answers[f.id]} />
		</div>
	{:else if f.type === 'choice'}
		<div class="row" role="radiogroup" aria-labelledby="q-{f.id}">
			<p class="q" id="q-{f.id}">{f.label}</p>
			<div class="options inline">
				{#each f.options as option (option)}
					<label class="option">
						<input type="radio" name={f.id} value={option} bind:group={answers[f.id]} />
						{option}
					</label>
				{/each}
			</div>
		</div>
	{:else if f.type === 'checklist'}
		<div class="row" role="group" aria-labelledby="q-{f.id}">
			<p class="q" id="q-{f.id}">{f.label}</p>
			<div class="options">
				{#each f.options as option (option)}
					<label class="option">
						<input type="checkbox" value={option} bind:group={answers[f.id]} />
						{option}
					</label>
				{/each}
			</div>
		</div>
	{:else if f.type === 'top3' || f.type === 'todo'}
		<div class="row" role="group" aria-labelledby="q-{f.id}">
			<p class="q" id="q-{f.id}">{f.label}</p>
			<ol class="list">
				<!-- Пункти — це позиції 1…n, тож ключ — номер -->
				{#each answers[f.id] as _, i (i)}
					<li><input class="answer" aria-label="{f.label}: {i + 1}" bind:value={answers[f.id][i]} /></li>
				{/each}
			</ol>
		</div>
	{:else if f.type === 'swot'}
		<div class="row wide" role="group" aria-labelledby="q-{f.id}">
			<p class="q" id="q-{f.id}">{f.label}</p>
			<div class="swot">
				{#each Object.entries(SWOT) as [key, name] (key)}
					<label>{name}<textarea class="answer" rows="4" bind:value={answers[f.id][key]}></textarea></label>
				{/each}
			</div>
		</div>
	{:else if f.type === 'statement'}
		<div class="row wide" role="group" aria-labelledby="q-{f.id}">
			<p class="q" id="q-{f.id}">{f.label}</p>
			<p class="say">
				Я, <input class="answer name" aria-label={STATEMENT.name} placeholder="ім’я, прізвище" bind:value={answers[f.id].name} />,
				хочу до <input class="answer date" type="date" aria-label={STATEMENT.date} bind:value={answers[f.id].date} />
				стати №1 в <input class="answer domain" aria-label={STATEMENT.domain} placeholder="своїй справі" bind:value={answers[f.id].domain} />
			</p>
		</div>
	{:else if f.type === 'matrix'}
		<div class="row wide" role="group" aria-labelledby="q-{f.id}">
			<p class="q" id="q-{f.id}">{f.label}</p>
			<table>
				<thead>
					<tr>
						<td></td>
						<th scope="col">Важливо</th>
						<th scope="col">{f.scale}, {SCALE.score}</th>
						<th scope="col">Пріоритет</th>
					</tr>
				</thead>
				{#each f.groups as group (group.name)}
					<tbody>
						{#if group.name}
							<tr><th scope="colgroup" colspan="4" class="group">{group.name}</th></tr>
						{/if}
						{#each group.items as item (item)}
							{@const row = answers[f.id][matrixKey(group.name, item)]}
							<tr>
								<th scope="row">{item}</th>
								<td><input type="checkbox" aria-label="{item}: важливо" bind:checked={row.on} /></td>
								<td>
									<select class="cell" aria-label="{item}: {f.scale}" bind:value={row.score}>
										<option value=""></option>
										{#each ['1', '2', '3', '4', '5'] as n (n)}<option>{n}</option>{/each}
									</select>
								</td>
								<td>
									<select class="cell" aria-label="{item}: пріоритет" bind:value={row.prio}>
										<option value=""></option>
										{#each SCALE.priority as p (p)}<option>{p}</option>{/each}
									</select>
								</td>
							</tr>
						{/each}
					</tbody>
				{/each}
			</table>
		</div>
	{/if}
{/snippet}

<style>
	/* --- Шапка --- */
	header {
		position: sticky;
		top: 0;
		z-index: 3;
		display: flex;
		gap: 24px;
		align-items: center;
		box-sizing: border-box;
		height: var(--header);
		padding: 0 24px;
		background: var(--bg);
		border-bottom: 1px solid var(--hairline);
		font-size: 0.9375rem;
	}
	.brand {
		margin-right: auto;
		font-weight: 800;
		letter-spacing: -0.02em;
		text-decoration: none;
	}
	.status {
		color: var(--muted);
	}
	.status.error {
		color: var(--flag);
	}
	header .link {
		text-decoration: none;
	}
	.where {
		display: none;
	}
	.boot {
		padding: 40px 24px;
		color: var(--muted);
	}

	/* --- Заява на кобальтовій плашці + маршрут --- */
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
	.edit {
		display: inline-block;
		margin-top: 28px;
		font-weight: 500;
	}

	/* --- Зміст-маршрут і стрічка бланка --- */
	.body {
		display: grid;
		grid-template-columns: 17rem minmax(0, 52rem);
		justify-content: center;
		gap: 56px;
		padding: 0 24px;
	}
	.body main {
		margin: 0;
		padding: 48px 0 120px;
	}

	.rail {
		color: var(--fg);
		font-size: 0.9375rem;
	}
	.trail,
	.trail ol {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	/* Стежка: вертикальна лінія крізь кружечки */
	.trail {
		position: relative;
	}
	.trail::before {
		content: '';
		position: absolute;
		top: 10px;
		bottom: 0;
		left: 8px;
		border-left: 2px dashed var(--hairline);
	}
	.rail a {
		position: relative;
		display: flex;
		gap: 10px;
		align-items: center;
		padding: 4px 6px 4px 0;
		color: inherit;
		text-decoration: none;
	}
	.rail a:hover .part-t,
	.rail a:hover .leg-t {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.leg {
		margin-top: 18px;
		font-weight: 800;
		font-size: 1.0625rem;
		letter-spacing: -0.01em;
	}
	.trail > li:first-child .leg {
		margin-top: 0;
	}
	.leg-n {
		color: var(--answer);
	}
	/* Кружечок-пиріг: частка заповненого */
	.pie {
		flex: none;
		box-sizing: border-box;
		width: 12px;
		height: 12px;
		margin-left: 3px;
		border: 2px solid var(--accent);
		border-radius: 50%;
		background: conic-gradient(var(--accent) calc(var(--p) * 360deg), var(--bg) 0);
	}
	.pie.big {
		width: 18px;
		height: 18px;
		margin-left: 0;
	}
	.part-t {
		flex: 1;
		min-width: 0;
	}
	.count {
		color: var(--muted);
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
	}
	.rail a[aria-current] {
		font-weight: 600;
	}
	.rail a[aria-current] .part-t {
		color: var(--answer);
	}
	.rail a[aria-current]::after {
		content: '';
		position: absolute;
		inset: 0 0 0 -8px;
		z-index: -1;
		background: var(--field);
	}
	.summit {
		position: relative;
		margin: 16px 0 0;
		padding-left: 26px;
		font-weight: 800;
		font-size: 1.25rem;
	}
	.summit::before {
		content: '';
		position: absolute;
		left: 4px;
		top: 4px;
		border: 7px solid transparent;
		border-left: 12px solid var(--flag);
	}

	/* Стрічка: великий номер кроку, розділ під товстою лінією, питання | відповідь */
	.intro {
		margin: 0;
		color: var(--muted);
	}
	.step {
		margin-top: 96px;
	}
	.step:first-child {
		margin-top: 56px;
	}
	h2 {
		display: flex;
		gap: 20px;
		align-items: baseline;
		font-size: 2.75rem;
	}
	.sn {
		color: var(--accent);
		font-size: 7.5rem;
		line-height: 0.75;
		letter-spacing: -0.08em;
	}
	h3 {
		display: flex;
		gap: 12px;
		align-items: baseline;
		margin-top: 56px;
		padding-top: 14px;
		border-top: 3px solid var(--fg);
		font-size: 1.5rem;
	}
	.pn {
		font-weight: 300;
	}
	.pc {
		margin-left: auto;
		color: var(--muted);
		font-size: 0.875rem;
		font-weight: 400;
		letter-spacing: 0;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.step,
	h3 {
		scroll-margin-top: calc(var(--header) + 24px);
	}
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
		gap: 10px 32px;
		padding: 16px 0;
		border-top: 1px solid var(--hairline);
	}
	h3 + .row {
		border-top: 0;
	}
	.row.wide {
		grid-template-columns: minmax(0, 1fr);
	}
	.q {
		margin: 0;
		font-weight: 500;
	}
	.options {
		display: grid;
		gap: 6px;
	}
	.options.inline {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 28px;
	}
	.option {
		display: flex;
		gap: 10px;
		align-items: center;
		cursor: pointer;
	}
	.date {
		width: auto;
	}
	.list {
		display: grid;
		gap: 6px;
		margin: 0;
		padding-left: 1.4em;
	}
	.list ::marker {
		color: var(--muted);
		font-weight: 500;
	}
	.swot {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px 24px;
	}
	.swot label {
		display: grid;
		gap: 6px;
		font-weight: 600;
	}
	.say {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 800;
		line-height: 2.1;
		letter-spacing: -0.02em;
	}
	.say .answer {
		display: inline-block;
		width: 9em;
		font-size: 1.125rem;
		letter-spacing: 0;
	}
	.say .domain {
		width: 14em;
	}
	.say .date {
		width: auto;
	}
	.note {
		margin: 0;
		padding: 0 0 16px;
		color: var(--muted);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9375rem;
	}
	th,
	td {
		padding: 6px 8px;
		text-align: center;
		border-bottom: 1px solid var(--hairline);
	}
	th[scope='row'] {
		text-align: left;
		font-weight: 300;
	}
	.group {
		padding-top: 20px;
		text-align: left;
		font-weight: 600;
	}
	thead th {
		vertical-align: bottom;
		color: var(--muted);
		font-size: 0.8125rem;
		font-weight: 400;
	}
	.cell {
		padding: 4px 6px;
		border: 0;
		background: var(--field);
		color: var(--answer);
		font: 500 0.9375rem/1.3 var(--font);
	}
	.to-map {
		display: inline-block;
		margin-top: 72px;
		padding: 14px 22px;
		background: var(--answer);
		color: var(--bg);
		font-weight: 500;
		text-decoration: none;
	}

	/* --- Великий екран: зміст закріплений ліворуч --- */
	@media (min-width: 901px) {
		.rail {
			/* inset спершу: він скидає top, який задає popover за замовчуванням */
			inset: auto;
			position: sticky;
			top: var(--header);
			display: block;
			align-self: start;
			box-sizing: border-box;
			width: auto;
			height: auto;
			max-height: calc(100vh - var(--header));
			margin: 0;
			padding: 48px 8px 32px 0;
			overflow-y: auto;
			border: 0;
			background: none;
		}
	}

	/* --- Телефон: зміст — спливна панель з кнопки «де я» --- */
	@media (max-width: 900px) {
		header {
			gap: 16px;
			padding: 0 16px;
		}
		.brand,
		.status {
			display: none;
		}
		.where {
			display: flex;
			flex: 1;
			gap: 8px;
			align-items: baseline;
			min-width: 0;
			padding: 6px 0;
			border: 0;
			background: none;
			color: inherit;
			font: 600 0.9375rem/1.2 var(--font);
			text-align: left;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			cursor: pointer;
		}
		.where-n {
			color: var(--answer);
			font-weight: 800;
		}
		.where::after {
			content: '▾';
			color: var(--muted);
		}
		.rail {
			position: fixed;
			inset: var(--header) 0 0 0;
			width: auto;
			height: auto;
			margin: 0;
			padding: 24px 16px 48px;
			overflow-y: auto;
			border: 0;
			background: var(--bg);
		}
		.hero-in {
			grid-template-columns: minmax(0, 1fr);
			gap: 32px;
			padding: 40px 16px 32px;
		}
		.body {
			grid-template-columns: minmax(0, 1fr);
			padding: 0 16px;
		}
		.body main {
			padding-top: 32px;
		}
		.row,
		.swot {
			grid-template-columns: minmax(0, 1fr);
		}
		h2 {
			font-size: 2rem;
		}
		.sn {
			font-size: 5rem;
		}
		h3 {
			font-size: 1.25rem;
		}
	}
</style>
