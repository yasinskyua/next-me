import { defineEnvVars } from '@sveltejs/kit/env';

// Обидва значення потрапляють у браузер. Захист даних — RLS у базі, не секретність ключа.
export const variables = defineEnvVars({
	SUPABASE_URL: {
		public: true,
		static: true,
		description: 'URL проєкту Supabase, https://<ref>.supabase.co',
		schema: (value) => {
			if (!value?.startsWith('https://')) throw new Error('SUPABASE_URL: потрібен https-URL проєкту, див. .env.example');
			return value;
		}
	},
	SUPABASE_PUBLISHABLE_KEY: {
		public: true,
		static: true,
		description: 'Публічний ключ Supabase (sb_publishable_…)',
		schema: (value) => {
			if (!value) throw new Error('SUPABASE_PUBLISHABLE_KEY не задано, див. .env.example');
			// Секретний ключ обходить RLS: у фронтенд він потрапити не має права
			if (value.startsWith('sb_secret_') || jwtRole(value) === 'service_role')
				throw new Error('SUPABASE_PUBLISHABLE_KEY: це секретний ключ. Потрібен publishable');
			return value;
		}
	}
});

function jwtRole(key: string): unknown {
	try {
		return JSON.parse(atob(key.split('.')[1])).role;
	} catch {
		return undefined;
	}
}
