import { createClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '$app/env/public';
import type { Database } from './database.types.js';
import { DEMO } from './demo.js';
import { PLAN, blankAnswers, merge, type Answers } from './plan.js';

// Один клієнт на весь застосунок. Чиї рядки видно — вирішує RLS у supabase/migrations.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
	auth: {
		// Сесія з листа приходить у фрагменті URL, тож посилання працює
		// навіть у браузері, відмінному від того, де просили лист
		flowType: 'implicit',
		detectSessionInUrl: true,
		persistSession: true,
		autoRefreshToken: true
	}
});

// У демо-режимі відповіді живуть тут, у пам'яті
let demoStore: Answers | undefined;

// Відповіді бланка, накладені на порожній бланк. RLS віддає лише рядок того, хто увійшов.
export async function loadAnswers(): Promise<Answers> {
	if (DEMO) return merge(blankAnswers(PLAN), (demoStore ??= (await import('./demo-answers.js')).default));
	const { data, error } = await supabase.from('plans').select('answers').maybeSingle();
	if (error) throw error;
	return merge(blankAnswers(PLAN), data?.answers);
}

export async function saveAnswers(userId: string, answers: Answers): Promise<{ error: { message: string } | null }> {
	if (DEMO) {
		demoStore = answers;
		return { error: null };
	}
	return supabase.from('plans').upsert({ user_id: userId, answers });
}
