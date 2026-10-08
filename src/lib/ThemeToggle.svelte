<script lang="ts">
	// Перемикач теми в шапці. До першого кліку тема як у системі; вибір живе в localStorage,
	// а застосовує його ще до показу сторінки скрипт у app.html.
	const root = document.documentElement;
	let dark = $state(
		root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
	);

	function toggle() {
		dark = !dark;
		root.dataset.theme = dark ? 'dark' : 'light';
		try {
			localStorage.setItem('theme', root.dataset.theme);
		} catch {
			// Приватний режим: тема просто не запам'ятається
		}
	}
</script>

<button
	type="button"
	class="theme"
	onclick={toggle}
	aria-label={dark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
	title={dark ? 'Світла тема' : 'Темна тема'}
>
	<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
		<circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.8" />
		<path d="M10 2.5 A7.5 7.5 0 0 1 10 17.5 Z" fill="currentColor" />
	</svg>
</button>

<style>
	.theme {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		cursor: pointer;
	}
	.theme:hover {
		color: var(--answer);
	}
</style>
