import type { AuthError, Session } from '@supabase/supabase-js';
import { resolve } from '$app/paths';
import { DEMO, DEMO_SESSION } from './demo.js';
import { supabase } from './supabase';

// Модульний стан тут безпечний: SSR вимкнено, кожна вкладка — один користувач
class Auth {
	session = $state.raw<Session | null>(null);
	ready = $state(false);

	constructor() {
		if (DEMO) {
			this.session = DEMO_SESSION;
			this.ready = true;
			return;
		}
		// INITIAL_SESSION приходить одразу, уже з сесією з посилання в листі, якщо вона є
		supabase.auth.onAuthStateChange((_event, session) => {
			this.session = session;
			this.ready = true;
		});
	}
}

export const auth = new Auth();

export async function sendMagicLink(email: string): Promise<AuthError | null> {
	if (DEMO) {
		auth.session = DEMO_SESSION;
		return null;
	}
	const { error } = await supabase.auth.signInWithOtp({
		email,
		options: {
			// Нових акаунтів не створюємо: вхід лише для заведених у Supabase
			shouldCreateUser: false,
			emailRedirectTo: new URL(resolve('/'), location.origin).href
		}
	});
	return error;
}

export async function signOut() {
	if (DEMO) auth.session = null;
	else await supabase.auth.signOut();
}
