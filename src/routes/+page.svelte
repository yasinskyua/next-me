<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { auth, signOut } from '#lib/auth.svelte.js';
	import { INTRO, PLAN, SCALE, STATEMENT, SWOT, matrixKey, partStatus } from '#lib/plan.js';
	import type { Answers, Field } from '#lib/plan.js';
	import { loadAnswers, supabase } from '#lib/supabase.js';

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
			const { error } = await supabase
				.from('plans')
				.upsert({ user_id: auth.session.user.id, answers: $state.snapshot(answers) });
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

	// Зміст: розділи з якорями і скільки в кожному заповнено
	const parts = PLAN.flatMap((step) => step.parts.map((part) => ({ step, part, id: `part-${part.num ?? step.n}` })));
	type TocPart = (typeof parts)[number];
	let hideDone = $state(false);

	const title = (p: TocPart) => `${p.part.num ? `${p.part.num}. ` : ''}${p.part.title}`;
	const complete = (p: TocPart) => {
		const s = partStatus(p.part, answers);
		return s.done === s.total;
	};
	const badge = (p: TocPart) => {
		const s = partStatus(p.part, answers);
		return s.done === s.total ? '✓' : `${s.done}/${s.total}`;
	};
	const total = parts.reduce((n, p) => n + partStatus(p.part, {}).total, 0);
	const done = $derived(parts.reduce((n, p) => n + partStatus(p.part, answers).done, 0));
	const firstEmpty = $derived(parts.find((p) => !complete(p)));

	function jump(e: Event & { currentTarget: HTMLSelectElement }) {
		document.getElementById(e.currentTarget.value)?.scrollIntoView();
		e.currentTarget.value = '';
	}
</script>

<svelte:window onbeforeunload={(e) => unsaved() && e.preventDefault()} />
<!-- На телефоні вкладку можуть вивантажити без beforeunload: зберігаємо, щойно вона ховається -->
<svelte:document onvisibilitychange={() => document.hidden && saved < edits && save()} />

<svelte:head>
	<title>План перемоги · Next Me</title>
</svelte:head>

<header>
	<span class="who">{auth.session?.user.email}</span>
	<span role="status" class={['status', status]}>
		{#if status === 'saving'}Зберігаю…{:else if status === 'saved'}Збережено{:else if status === 'error'}Не збережено{/if}
	</span>
	{#if status === 'error'}
		<button type="button" onclick={save}>Повторити</button>
	{/if}
	<a href={resolve('/map')} onclick={toMap}>План-карта</a>
	<button type="button" onclick={async () => (await flush()) && signOut()}>Вийти</button>
</header>

<div class="layout">
	<aside>
		{#await loading then}
			<p class="total">Заповнено <b>{done}</b> з {total}</p>
			<progress value={done} max={total}></progress>
			{#if firstEmpty}
				<a class="next" href="#{firstEmpty.id}">Перший незаповнений: {title(firstEmpty)}</a>
			{:else}
				<p class="next">Усе заповнено ✓</p>
			{/if}

			<label class="hide"><input type="checkbox" bind:checked={hideDone} /> Сховати заповнені</label>
			<ul class="toc">
				{#each PLAN as step (step.n)}
					{@const visible = parts.filter((p) => p.step === step && !(hideDone && complete(p)))}
					{#if visible.length}
						<li class="step">Крок {step.n}. {step.title}</li>
						{#each visible as p (p.id)}
							<li>
								<a href="#{p.id}">
									<span>{title(p)}</span>
									<span class={['badge', { ok: complete(p) }]}>{badge(p)}</span>
								</a>
							</li>
						{/each}
					{/if}
				{/each}
			</ul>

			<select class="mobile" aria-label="Перейти до розділу" onchange={jump}>
				<option value="">Перейти до розділу…</option>
				{#each parts as p (p.id)}
					<option value={p.id}>{badge(p)} · {title(p)}</option>
				{/each}
			</select>
		{/await}
	</aside>

	<main>
		<h1>План перемоги</h1>
		<p>{INTRO}</p>

		{#if status === 'error'}
			<p role="alert">Не вдалося зберегти: {problem}. Відповіді лишаються на сторінці, натисни «Повторити».</p>
		{/if}

		{#await loading}
			<p>Завантаження…</p>
		{:then}
			<form oninput={edited} onsubmit={(e) => e.preventDefault()}>
				{#each PLAN as step (step.n)}
					<section id="step-{step.n}">
						<h2>Крок {step.n}. {step.title}</h2>
						{#each step.parts as part (part.title)}
							<h3 id="part-{part.num ?? step.n}">{part.num ? `${part.num}. ` : ''}{part.title}</h3>
							{#each part.fields as f (f.type === 'note' ? f.text : f.id)}
								{@render field(f)}
							{/each}
						{/each}
					</section>
				{/each}
			</form>
		{:catch error}
			<p role="alert">Не вдалося завантажити бланк: {error.message}</p>
		{/await}
	</main>
</div>

{#snippet field(f: Field)}
	{#if f.type === 'note'}
		<p class="note">{f.text}</p>
	{:else if f.type === 'text'}
		<label class="q" for={f.id}>{f.label}</label>
		<textarea id={f.id} rows={f.rows} bind:value={answers[f.id]}></textarea>
	{:else if f.type === 'date'}
		<label class="q" for={f.id}>{f.label}</label>
		<input id={f.id} type="date" bind:value={answers[f.id]} />
	{:else if f.type === 'choice'}
		<fieldset>
			<legend class="q">{f.label}</legend>
			{#each f.options as option (option)}
				<label class="option">
					<input type="radio" name={f.id} value={option} bind:group={answers[f.id]} />
					{option}
				</label>
			{/each}
		</fieldset>
	{:else if f.type === 'checklist'}
		<fieldset>
			<legend class="q">{f.label}</legend>
			{#each f.options as option (option)}
				<label class="option">
					<input type="checkbox" value={option} bind:group={answers[f.id]} />
					{option}
				</label>
			{/each}
		</fieldset>
	{:else if f.type === 'top3' || f.type === 'todo'}
		<fieldset>
			<legend class="q">{f.label}</legend>
			<ol>
				<!-- Пункти — це позиції 1…n, тож ключ — номер -->
				{#each answers[f.id] as _, i (i)}
					<li><input aria-label="{f.label}: {i + 1}" bind:value={answers[f.id][i]} /></li>
				{/each}
			</ol>
		</fieldset>
	{:else if f.type === 'swot'}
		<fieldset>
			<legend class="q">{f.label}</legend>
			<div class="swot">
				{#each Object.entries(SWOT) as [key, name] (key)}
					<label>{name}<textarea rows="4" bind:value={answers[f.id][key]}></textarea></label>
				{/each}
			</div>
		</fieldset>
	{:else if f.type === 'statement'}
		<fieldset class="statement">
			<legend class="q">{f.label}</legend>
			<label>{STATEMENT.name}<input bind:value={answers[f.id].name} /></label>
			<label>{STATEMENT.date}<input type="date" bind:value={answers[f.id].date} /></label>
			<label>{STATEMENT.domain}<input bind:value={answers[f.id].domain} /></label>
		</fieldset>
	{:else if f.type === 'matrix'}
		<fieldset>
			<legend class="q">{f.label}</legend>
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
									<select aria-label="{item}: {f.scale}" bind:value={row.score}>
										<option value=""></option>
										{#each ['1', '2', '3', '4', '5'] as n (n)}<option>{n}</option>{/each}
									</select>
								</td>
								<td>
									<select aria-label="{item}: пріоритет" bind:value={row.prio}>
										<option value=""></option>
										{#each SCALE.priority as p (p)}<option>{p}</option>{/each}
									</select>
								</td>
							</tr>
						{/each}
					</tbody>
				{/each}
			</table>
		</fieldset>
	{/if}
{/snippet}

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 1;
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 8px 16px;
		background: Canvas;
		border-bottom: 1px solid color-mix(in srgb, CanvasText 15%, transparent);
	}
	.who {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 0.7;
	}
	.status {
		font-size: 0.875rem;
		opacity: 0.7;
	}
	.status.error {
		color: #c62828;
		opacity: 1;
	}
	.layout {
		display: grid;
		grid-template-columns: 16rem minmax(0, 40rem);
		justify-content: center;
		gap: 40px;
		padding: 0 16px;
	}
	.layout main {
		margin: 0;
		padding: 32px 0 64px;
	}
	aside {
		position: sticky;
		top: 56px;
		align-self: start;
		max-height: calc(100vh - 56px);
		overflow-y: auto;
		padding: 32px 0 16px;
	}
	.total {
		margin: 0 0 4px;
	}
	progress {
		width: 100%;
	}
	.next {
		display: block;
		margin: 8px 0;
		font-size: 0.875rem;
	}
	.hide {
		display: flex;
		gap: 6px;
		margin: 12px 0;
		font-size: 0.875rem;
	}
	.toc {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.toc li + li {
		margin-top: 0;
	}
	.step {
		margin: 16px 0 4px;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.6;
	}
	.toc a {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		padding: 4px 8px;
		border-radius: 6px;
		color: inherit;
		font-size: 0.9375rem;
		text-decoration: none;
	}
	.toc a:hover {
		background: color-mix(in srgb, CanvasText 8%, transparent);
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
		width: 100%;
	}
	@media (max-width: 800px) {
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
		}
	}
	section,
	h3 {
		scroll-margin-top: 56px;
	}
	h2 {
		margin-top: 48px;
	}
	.q {
		display: block;
		margin: 20px 0 6px;
		font-weight: 600;
	}
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
		min-width: 0;
	}
	legend {
		padding: 0;
	}
	.option {
		display: flex;
		gap: 8px;
		align-items: baseline;
		padding: 2px 0;
	}
	textarea,
	input:not([type='radio'], [type='checkbox']),
	select {
		box-sizing: border-box;
		font: inherit;
	}
	textarea,
	input:not([type='radio'], [type='checkbox']) {
		width: 100%;
		padding: 6px 8px;
	}
	textarea {
		resize: vertical;
	}
	ol {
		margin: 0;
		padding-left: 1.5em;
	}
	li + li {
		margin-top: 6px;
	}
	.swot {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 12px;
	}
	.statement {
		display: grid;
		gap: 8px;
	}
	.note {
		padding: 8px 12px;
		border-left: 3px solid color-mix(in srgb, CanvasText 30%, transparent);
		opacity: 0.8;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		padding: 4px 6px;
		text-align: center;
		border-bottom: 1px solid color-mix(in srgb, CanvasText 10%, transparent);
	}
	th[scope='row'],
	.group {
		text-align: left;
		font-weight: normal;
	}
	.group {
		font-weight: 600;
		padding-top: 16px;
	}
	thead th {
		font-size: 0.8125rem;
		font-weight: normal;
		opacity: 0.7;
	}
</style>
