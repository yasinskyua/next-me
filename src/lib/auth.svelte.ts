import type { AuthError, Session } from '@supabase/supabase-js';
import { resolve } from '$app/paths';
import { supabase } from './supabase';

// Модульний стан тут безпечний: SSR вимкнено, кожна вкладка — один користувач
class Auth {
	session = $state.raw<Session | null>(null);
	ready = $state(false);

	constructor() {
		// INITIAL_SESSION приходить одразу, уже з сесією з посилання в листі, якщо вона є
		supabase.auth.onAuthStateChange((_event, session) => {
			this.session = session;
			this.ready = true;
		});
	}
}

export const auth = new Auth();

export async function sendMagicLink(email: string): Promise<AuthError | null> {
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

export const signOut = () => supabase.auth.signOut();
