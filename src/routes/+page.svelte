<script lang="ts">
	import { auth, signOut } from '#lib/auth.svelte.js';
	import { supabase } from '#lib/supabase.js';

	// Димова перевірка зв'язки «вхід → RLS»: лічильники бачать лише власні рядки
	const counts = Promise.all([
		supabase.from('entries').select('*', { count: 'exact', head: true }),
		supabase.from('plans').select('*', { count: 'exact', head: true })
	]);
</script>

<main>
	<h1>Next Me</h1>
	<p>Ти увійшов як <b>{auth.session?.user.email}</b>.</p>

	{#await counts}
		<p>Перевіряю базу…</p>
	{:then [entries, plans]}
		{#if entries.error || plans.error}
			<p role="alert">База не відповіла: {(entries.error ?? plans.error)?.message}</p>
		{:else}
			<p>База на зв'язку: записів {entries.count}, планів {plans.count}.</p>
		{/if}
	{/await}

	<button type="button" onclick={signOut}>Вийти</button>
</main>
