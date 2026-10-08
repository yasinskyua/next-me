<script lang="ts">
	import { auth, signOut } from '#lib/auth.svelte.js';
	import { supabase } from '#lib/supabase.js';

	// Димова перевірка зв'язки «вхід → RLS»: лічильник бачить лише власні рядки
	const plans = supabase.from('plans').select('*', { count: 'exact', head: true });
</script>

<main>
	<h1>Next Me</h1>
	<p>Ти увійшов як <b>{auth.session?.user.email}</b>.</p>

	{#await plans}
		<p>Перевіряю базу…</p>
	{:then { count, error }}
		{#if error}
			<p role="alert">База не відповіла: {error.message}</p>
		{:else}
			<p>База на зв'язку: планів {count}.</p>
		{/if}
	{/await}

	<button type="button" onclick={signOut}>Вийти</button>
</main>
