<script lang="ts">
	import { sendMagicLink } from '#lib/auth.svelte.js';

	let email = $state('');
	let status = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');
	let message = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		status = 'sending';
		const error = await sendMagicLink(email.trim());
		if (!error) {
			status = 'sent';
			return;
		}

		// Ховати причину немає сенсу: API Supabase і так повертає її у відповіді
		status = 'error';
		if (error.code === 'otp_disabled')
			message = 'Ця адреса не має доступу. Перевір, чи вона точно збігається із заведеною в Supabase.';
		else if (error.status === 429)
			message = 'Забагато спроб. Безкоштовна пошта Supabase надсилає кілька листів на годину, зачекай і спробуй ще раз.';
		else if (error.name === 'AuthRetryableFetchError')
			message = 'Немає зв’язку із сервером. Перевір інтернет і спробуй ще раз.';
		else message = `Не вдалося надіслати лист: ${error.message}`;
	}
</script>

<svelte:head>
	<title>Вхід · Next Me</title>
</svelte:head>

<main>
	<h1>Вхід</h1>

	{#if status === 'sent'}
		<p>Лист надіслано на <b>{email.trim()}</b>. Відкрий посилання з нього: воно діє годину. Немає листа — глянь у «Спам».</p>
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
