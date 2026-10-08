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

<div class="login">
	<main>
		<h1>План перемоги</h1>

		{#if status === 'sent'}
			<p class="lead">Лист надіслано на <b>{email.trim()}</b>. Відкрий посилання з нього: воно діє годину. Немає листа — глянь у «Спам».</p>
			<button type="button" class="btn" onclick={() => (status = 'idle')}>Надіслати ще раз</button>
		{:else}
			<p class="lead">Твій шлях до №1. Введи пошту, і я надішлю посилання для входу.</p>
			<form onsubmit={submit}>
				<label for="email">Пошта</label>
				<input id="email" class="answer" type="email" autocomplete="email" required bind:value={email} />
				<button class="btn" disabled={status === 'sending'}>
					{status === 'sending' ? 'Надсилаю…' : 'Надіслати посилання'}
				</button>
				{#if status === 'error'}
					<p role="alert">{message}</p>
				{/if}
			</form>
		{/if}
	</main>
</div>

<style>
	/* Вхід — уся сторінка в кольорі плашки із заявою */
	.login {
		display: grid;
		align-items: center;
		min-height: 100vh;
		background: var(--hero);
		color: var(--on-hero);
	}
	main {
		width: 100%;
		max-width: 60rem;
	}
	h1 {
		font-size: clamp(3rem, 10vw, 7.5rem);
		line-height: 0.92;
		letter-spacing: -0.055em;
	}
	.lead {
		max-width: 26em;
		margin: 28px 0 0;
		font-size: 1.25rem;
		opacity: 0.8;
	}
	form {
		display: grid;
		gap: 10px;
		max-width: 26rem;
		margin-top: 40px;
	}
	label {
		font-weight: 500;
	}
	.answer {
		background: var(--bg);
	}
	.btn {
		justify-self: start;
		margin-top: 8px;
	}
	[role='alert'] {
		margin: 8px 0 0;
		padding: 10px 12px;
		background: var(--bg);
	}
</style>
