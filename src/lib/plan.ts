// Контент «Плану перемоги»: кроки, розділи й поля бланка.
// id полів — ключі у plans.answers, не міняти.

export type Field =
	| { type: 'text'; id: string; label: string; rows?: number }
	| { type: 'choice'; id: string; label: string; options: string[] }
	| { type: 'checklist'; id: string; label: string; options: string[] }
	| { type: 'top3'; id: string; label: string }
	| { type: 'date'; id: string; label: string }
	| { type: 'statement'; id: string; label: string }
	| { type: 'swot'; id: string; label: string }
	| { type: 'matrix'; id: string; label: string; scale: string; groups: { name?: string; items: string[] }[] }
	| { type: 'todo'; id: string; label: string; count: number }
	| { type: 'note'; text: string };

export type Part = { num?: string; title: string; fields: Field[] };
export type Step = { n: number; title: string; parts: Part[] };

export const INTRO = 'Відповідай на всі питання бланка, а потім склади з відповідей особистий план-карту.';

export const SWOT = { s: 'Сильні сторони', w: 'Слабкі сторони', o: 'Можливості', t: 'Загрози' } as const;
export const STATEMENT = { name: 'Я (ім’я, прізвище)', date: 'хочу до (дата)', domain: 'стати №1 в …' } as const;
export const SCALE = { score: '1–5', priority: ['A', 'B', 'C'] } as const;

const YES_NO = ['так', 'ні'];
const CYCLE = ['вихід на «ринок»', 'ріст', 'насичення', 'спад'];

const text = (id: string, label: string, rows = 3): Field => ({ type: 'text', id, label, rows });
const choice = (id: string, label: string, options: string[]): Field => ({ type: 'choice', id, label, options });
const yesNo = (id: string, label: string) => choice(id, label, YES_NO);
const checklist = (id: string, label: string, options: string[]): Field => ({ type: 'checklist', id, label, options });
const top3 = (id: string, label: string): Field => ({ type: 'top3', id, label });

export const PLAN: Step[] = [
	{ n: 1, title: 'Мета', parts: [
		{ title: 'Цілимося', fields: [
			text('goal', 'Я хочу бути №1 (пиши словами, візуалізуй, якщо можеш)', 4),
		] },
	] },
	{ n: 2, title: 'Аудит', parts: [
		{ num: '2.1', title: 'Де ти зараз?', fields: [
			{ type: 'swot', id: 'swot', label: 'Заповни свою таблицю SWOT-аналізу' },
			yesNo('s_full', 'Чи на 100% ти використовуєш свої сильні сторони?'),
			text('s_more', 'Якщо ні, що треба зробити, аби збільшити віддачу?', 2),
			yesNo('w_known', 'Чи всі свої слабкі сторони ти знаєш?'),
			text('w_fix', 'Що потрібно зробити задля їх усунення?', 2),
			yesNo('o_known', 'Чи знаєш ти всі свої можливості?'),
			text('o_miss', 'Що пропущено?', 2),
			yesNo('t_known', 'Чи знаєш ти всі свої ризики?'),
			text('t_miss', 'Що забуто?', 2),
			yesNo('goal_ok', 'Чи точно тобі підходить скорегована вже мета?'),
			text('goal_new', 'Моя скорегована мета', 2),
			{ type: 'statement', id: 'stmt', label: 'Моя скорегована мета' },
			{ type: 'statement', id: 'stmt2', label: 'Може статися, що під час роботи над метою ти ще раз її скорегуєш' },
		] },
		{ num: '2.2', title: 'Початкові дані', fields: [
			checklist('innate', 'Постав позначку поруч з тими, які заважають тобі стати №1', ['Зріст', 'Вага', 'Статура', 'Постава', 'Хода', 'Драйв і загальний тонус', 'Голос', 'Стан шкіри', 'Стан волосся', 'Стан зубів', 'Запах', 'Метушливість']),
			text('innate_fix', 'Що й як потрібно виправити?'),
		] },
		{ num: '2.3', title: '«Вітаю, я…»', fields: [
			checklist('intro', 'Що виправити в тому, як ти себе називаєш і показуєш', ['Ім’я, прізвище, по батькові', 'Прізвисько, звання, титул', 'Псевдонім', 'Email', 'Аватарка', 'Автопідпис', 'Ніки в соцмережах']),
			text('intro_fix', 'Що і як потрібно виправити?'),
		] },
		{ num: '2.4', title: 'Мати гарний вигляд', fields: [
			checklist('look', 'Подивись на себе збоку. Чи треба щось змінити в іміджі?', ['Одяг', 'Взуття', 'Аксесуари', 'Запах', 'Фізична форма', 'Стан обличчя']),
			text('look_fix', 'Що, як і коли треба виправити?'),
		] },
		{ num: '2.5', title: 'Підтримка ближнього кола', fields: [
			checklist('support', 'Познач, чиєю підтримкою хочеш заручитися.', ['Обговорити мету з чоловіком/дружиною', 'Розповісти батькам, можливо попросити допомоги', 'Подумати, чим поділитися з дітьми', 'Обговорити мету з близьким другом']),
		] },
		{ num: '2.6', title: 'Наставник', fields: [
			yesNo('mentor', 'Чи є в тебе наставник?'),
			text('mentor_who', 'Хто це може бути? Як налагодити з ним контакт?', 2),
			yesNo('mentor_ok', 'Чи правильно ти з ним працюєш?'),
			text('mentor_better', 'Як покращити співпрацю?', 2),
		] },
		{ num: '2.7', title: 'Життєвий цикл', fields: [
			choice('cycle_now', 'На якому етапі життєвого циклу зараз перебуває твоя кар’єра?', CYCLE),
			choice('cycle_next', 'Який етап наступний?', CYCLE),
			text('cycle_prep', 'Що тобі потрібно зробити, щоб підготуватися до наступного етапу?'),
		] },
		{ num: '2.8', title: 'Успіх', fields: [
			yesNo('luck', 'Тобі щастить?'),
			text('luck_effort', 'Якщо так: чи не стоїть за цим результатом більше зусиль, ніж зазвичай?', 2),
		] },
		{ num: '2.9', title: 'Самомотивація', fields: [
			choice('motivation', 'Як у тебе з самомотивацією?', ['добре', 'погано']),
			{ type: 'note', text: 'Якщо погано, мабуть, мета не та? У такому разі повернись до першого розділу.' },
		] },
		{ num: '2.10', title: 'Коли стартувати?', fields: [
			yesNo('started', 'Ти вже на шляху до №1?'),
			{ type: 'date', id: 'start_date', label: 'Якщо ні — час. Напиши дату старту.' },
		] },
	] },
	{ n: 3, title: 'Розвиток', parts: [
		{ num: '3.1', title: 'Професійний розвиток', fields: [
			checklist('learn', 'Які способи навчання для тебе найприйнятніші?', ['Практика', 'Читання', 'Аудіо', 'Відео', 'Навчання в аудиторії', 'Нетворкінг', 'Подорожі', 'Знання «з перших рук»']),
			text('learn_main', 'Теми, в яких треба розширити знання: за своєю спеціальністю'),
			text('learn_adj', 'За суміжними спеціальностями'),
		] },
		{ num: '3.2', title: 'Особистий розвиток', fields: [
			{ type: 'matrix', id: 'skills', label: 'Важливість навички (став позначку поруч з тими, які для тебе найважливіші)', scale: 'Розвиненість', groups: [
				{ name: 'Комунікації', items: ['Говорити', 'Слухати й чути', 'Вести переговори', 'Мова жестів', 'Публічні виступи', 'Грамотність', 'Бути завжди на зв’язку', 'Добре писати', 'Іноземні мови', 'Манери та етикет'] },
				{ name: 'Інші навички', items: ['Швидко й багато читати', 'Креативність', 'Тайм-менеджмент', 'Пунктуальність', 'Тримати слово', 'Казати «ні»', 'Делегувати', 'Доводити до кінця', 'Мотивувати', 'Тримати удар', 'Прискорюватися', 'Фокус і концентрація', 'Тримати темп, енергійність', 'Казати «дякую»', 'Проводити наради й брати в них участь', 'Приймати нове та зміни', 'Розуміти й використовувати сучасні технології', 'Продавати ідеї', 'Нетворкінг', 'Почуття гумору та оптимізм'] },
			] },
		] },
	] },
	{ n: 4, title: 'Результати', parts: [
		{ num: '4.1', title: 'Гроші', fields: [
			text('worth', 'Якщо тебе запитають, скільки ти коштуєш, то що ти відповіси?', 2),
			text('money_pride', 'Якою сумою — заробленою чи заощадженою для себе або інших — ти пишаєшся?', 2),
		] },
		{ num: '4.2', title: 'Предмет власної гордості', fields: [
			top3('pride_done', 'Які твої найкрасномовніші професійні досягнення?'),
			top3('pride_1y', 'Що ти хочеш зробити і чим пишатися найближчого року?'),
			top3('pride_3y', 'Що ти хочеш зробити і чим пишатися протягом найближчих 5 років?'),
		] },
		{ num: '4.3', title: 'Суспільне визнання', fields: [
			top3('awards_now', 'Які професійні нагороди зараз для тебе найцінніші?'),
			top3('awards_1y', 'Які нагороди ти хочеш отримати найближчого року?'),
			top3('awards_5y', 'Які нагороди ти хочеш отримати протягом найближчих 5 років?'),
		] },
	] },
	{ n: 5, title: 'Просування', parts: [
		{ num: '5.1', title: 'Брендбук', fields: [
			{ type: 'matrix', id: 'brand', label: 'Які елементи власного бренду для тебе важливі? Що потрібно розвинути передусім?', scale: 'Наскільки вдалі', groups: [
				{ items: ['Позиціонування', 'Гасло', '«100 слів»', 'Резюме', 'Візитка', 'Портфоліо', 'Фотосесія', 'Рекомендації та відгуки'] },
			] },
		] },
		{ num: '5.2', title: '«Світитися»', fields: [
			{ type: 'matrix', id: 'shine', label: 'Де і як ти показуєш себе? Що ще ти можеш зробити?', scale: 'Наскільки вдало', groups: [
				{ name: 'Виступи на заходах', items: ['Учасник', 'Спонсор', 'Модератор', 'Спікер'] },
				{ name: 'Радіо та телебачення', items: ['Гість', 'Експерт', 'Учасник', 'Ведучий'] },
				{ name: 'Публікації', items: ['Статті', 'Інтерв’ю', 'Коментарі', 'Рубрика/колонка', 'Книжка', 'Форуми', 'Соцмережі', 'Блог'] },
			] },
		] },
		{ num: '5.3', title: 'Правила життя', fields: [
			yesNo('rules', 'Чи є в тебе правила життя? Якщо ні — напиши зараз!'),
			text('rules_text', 'Які твої правила життя?', 5),
			yesNo('rules_pub', 'Чи годяться вони для публікації в глянцевому журналі?'),
			text('rules_why', 'Якщо ні — а чому?', 2),
		] },
		{ num: '5.4', title: 'Репутація', fields: [
			choice('reputation', 'Яка в тебе репутація? З якою машиною тебе можна порівняти?', ['«роллс-ройс»', '«жигулі»']),
		] },
		{ num: '5.5', title: 'Віддавати', fields: [
			checklist('give', 'Що ти вже робиш для інших?', ['Викладання у ВНЗ', 'Виступи на конференціях', 'Тренінги та майстер-класи', 'Ведення блогу', 'Публікації', 'Написання книжок', 'Наставництво']),
			{ type: 'todo', id: 'give_next', label: 'Що ще потрібно зробити', count: 7 },
		] },
	] },
];

// --- Відповіді: plans.answers = { [id поля]: значення } ---

// any: форма значення залежить від типу поля (рядок, масив, об'єкт)
export type Answers = Record<string, any>;

export const matrixKey = (group: string | undefined, item: string) => (group ? `${group} / ${item}` : item);

function blank(f: Exclude<Field, { type: 'note' }>): unknown {
	switch (f.type) {
		case 'text': case 'choice': case 'date': return '';
		case 'checklist': return [];
		case 'top3': return ['', '', ''];
		case 'todo': return Array(f.count).fill('');
		case 'swot': return { s: '', w: '', o: '', t: '' };
		case 'statement': return { name: '', date: '', domain: '' };
		case 'matrix': return Object.fromEntries(f.groups.flatMap((g) =>
			g.items.map((item) => [matrixKey(g.name, item), { on: false, score: '', prio: '' }])));
	}
}

export const blankAnswers = (plan: Step[]): Answers => Object.fromEntries(
	plan.flatMap((s) => s.parts.flatMap((p) => p.fields.flatMap((f) => (f.type === 'note' ? [] : [[f.id, blank(f)]])))));

// Збережене лягає на порожній бланк: нові поля отримують порожні значення,
// а ключі, яких у бланку вже немає (перейменований пункт), лишаються в базі.
export function merge(blank: unknown, saved: unknown): Answers[string] {
	if (Array.isArray(blank)) {
		if (!Array.isArray(saved)) return blank;
		return blank.length ? [...blank.map((b, i) => merge(b, saved[i])), ...saved.slice(blank.length)] : saved;
	}
	if (blank && typeof blank === 'object') {
		if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return blank;
		const out: Answers = { ...saved };
		for (const [k, b] of Object.entries(blank)) out[k] = merge(b, (saved as Answers)[k]);
		return out;
	}
	return typeof saved === typeof blank ? saved : blank;
}
