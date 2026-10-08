# Next Me

Особистий щоденник: «План перемоги» і датовані записи про шлях до мети.
SvelteKit 3 (статичний SPA) на GitHub Pages + Supabase (Postgres з RLS, вхід за посиланням з пошти).

## Архітектура

| Файл | Роль |
|---|---|
| `src/lib/supabase.ts` | Єдиний клієнт Supabase |
| `src/lib/auth.svelte.ts` | Стан входу, лист із посиланням, вихід |
| `src/routes/+layout.svelte` | Пускає на сторінки лише з сесією. Це зручність, захист даних — RLS |
| `src/env.ts` | Публічні змінні. Збірка падає без них або із секретним ключем |
| `supabase/migrations/` | Схема і RLS: кожен бачить лише свої рядки, anon — нічого |
| `supabase/config.toml` | Налаштування входу: URL перенаправлень, реєстрацію вимкнено |
| `.github/workflows/deploy.yml` | Перевірка, збірка й деплой на Pages при пуші в `main` |

## Локально

```bash
cp .env.example .env.local   # заповнити значеннями з Supabase
npm install
npm run dev
```

## Supabase (один раз)

```bash
supabase login
supabase link --project-ref <ref>
supabase db push                         # схема і RLS
supabase config diff && supabase config push   # налаштування входу
supabase gen types typescript --linked > src/lib/database.types.ts
```

Далі в Dashboard → Authentication → Users → Add user: завести свою пошту (самореєстрацію вимкнено).

## GitHub Pages

Settings → Pages → Source: GitHub Actions.
Settings → Secrets and variables → Actions → Variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`.
