import type { Session } from '@supabase/supabase-js';
import { dev } from '$app/env';

// Демо-режим для локальної перевірки вигляду: npm run demo.
// Без входу і без бази: вигадані відповіді живуть у пам'яті до перезавантаження.
// dev = false у збірці для сайту, тож там цей режим ніколи не вмикається.
export const DEMO = dev && import.meta.env.MODE === 'demo';

export const DEMO_SESSION = { user: { id: 'demo', email: 'demo@localhost' } } as Session;
