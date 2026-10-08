# Next Me

Особистий «План перемоги» (шлях до №1) за бланком із книжки. Інтерфейс українською. Архітектура — README.md.

## SvelteKit 3, не 2

Пам'ять про SvelteKit 2 тут шкодить. Сумнів — `npx @sveltejs/mcp get-documentation`.

- Конфіг Kit — у `vite.config.ts` (плагін `sveltekit({...})`), `svelte.config.js` немає.
- `#lib/...` замість `$lib`, з розширенням: `#lib/supabase.js`, `#lib/auth.svelte.js`.
- Змінні оточення оголошуються в `src/env.ts`, читаються з `$app/env/public`.
- Шляхи — `resolve('/route')` з `$app/paths`; `base` видалено.
- `goto(..., { replace: true })`, не `replaceState`.

## Статика на GitHub Pages

Сервера немає: `ssr = false`, жодних `+page.server.ts`, `+server.ts`, form actions.
Вся логіка доступу до даних — RLS у Supabase.

## Supabase

- Кожна таблиця в `public`: RLS увімкнено, `grant ... to authenticated`, `revoke ... from anon`,
  окрема політика на кожну операцію з `(select auth.uid()) = user_id`.
- Зміни схеми: `supabase migration new <name>` → SQL → `supabase db push`. Готові міграції не редагувати.
- Налаштування входу правити в `supabase/config.toml`, застосовувати `supabase config diff` → `supabase config push`.
- У фронтенді лише publishable-ключ. Секретний / service_role — ніколи.

## Контент бланка

Питання «Плану перемоги» — переказ у `workbook.md`. `ocr.md` — розпізнаний текст книжки:
не комітити, не цитувати, не переносити в код.
