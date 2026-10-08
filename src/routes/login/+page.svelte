<script lang="ts">
	import { sendMagicLink } from '#lib/auth.svelte.js';

	let email = $state('');
	let status = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');
	let message = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		status = 'sending';
		const error = await sendMagicLink(email.trim());

		if (error?.status === 429) {
			status = 'error';
			message = 'Забагато спроб. Зачекай хвилину й спробуй ще раз.';
		} else if (error?.name === 'AuthRetryableFetchError') {
			status = 'error';
			message = 'Немає зв’язку із сервером. Перевір інтернет і спробуй ще раз.';
		} else {
			// Однакова відповідь для будь-якої адреси: сторінка не підказує, хто має доступ
			status = 'sent';
		}
	}
</script>

<svelte:head>
	<title>Вхід · Next Me</title>
</svelte:head>

<main>
	<h1>Вхід</h1>

	{#if status === 'sent'}
		<p>Якщо ця адреса має доступ, лист уже в дорозі. Відкрий посилання з нього: воно діє годину.</p>
		<button type="button" onclick={() => (status = 'idle')}>Надіслати ще раз</button>
	{:else}
		<form onsubmit={submit}>
			<label for="email">Пошта</label>
			<input id="email" type="email" autocomplete="email" required bind:value={email} />
			<button disabled={status === 'sending'}>
				{status === 'sending' ? 'Надсилаю…' : 'Надіслати посилання'}
			</button>
			{#if status === 'error'}
				<p role="alert">{message}</p>
			{/if}
		</form>
	{/if}
</main>
