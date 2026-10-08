import { createClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '$app/env/public';

// Один клієнт на весь застосунок. Чиї рядки видно — вирішує RLS у supabase/migrations.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
	auth: {
		// Сесія з листа приходить у фрагменті URL, тож посилання працює
		// навіть у браузері, відмінному від того, де просили лист
		flowType: 'implicit',
		detectSessionInUrl: true,
		persistSession: true,
		autoRefreshToken: true
	}
});
