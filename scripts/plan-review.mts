// Таблиці звірки «Плану перемоги» з книжкою. Нумерація рядків в обох файлах однакова.
//   node scripts/plan-review.mts            → docs/plan-review.md   (мої формулювання; комітиться)
//   node scripts/plan-review.mts --compare  → + docs/plan-compare.md (поруч рядок з ocr.md; лише локально, у .gitignore)
//   node scripts/plan-review.mts --check    → самоперевірка зіставлення
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { INTRO, PLAN, STATEMENT, SWOT } from '../src/lib/plan.ts';

type Row = { n: number; pages: string; part: string; type: string; text: string; query: string };

const TYPE: Record<string, string> = {
	text: 'текст', choice: 'вибір', checklist: 'чекліст', top3: 'топ-3', date: 'дата', statement: 'заява',
	swot: 'SWOT', matrix: 'таблиця 1–5 + A/B/C', todo: 'список справ', note: 'примітка'
};

function buildRows(): Row[] {
	const rows: Row[] = [];
	// query — те, що шукаємо в книжці: саме питання, без варіантів відповіді
	const add = (pages: string, part: string, type: string, text: string, query = text) =>
		rows.push({ n: rows.length + 1, pages, part, type, text, query });

	add('181', 'Вступ', 'текст', INTRO);
	for (const step of PLAN) {
		add(step.parts[0].pages, `**Крок ${step.n}**`, 'заголовок', step.title, `Крок ${step.n}. ${step.title}`);
		for (const p of step.parts) {
			const part = p.num ?? String(step.n);
			add(p.pages, part, 'заголовок', p.title, `${p.num ? p.num + '. ' : ''}${p.title}`);
			for (const f of p.fields) {
				if (f.type === 'note') { add(p.pages, part, TYPE.note, f.text); continue; }
				let text = f.label;
				if (f.type === 'choice' || f.type === 'checklist') text += ` → ${f.options.join(' · ')}`;
				if (f.type === 'swot') text += ` → ${Object.values(SWOT).join(' · ')}`;
				if (f.type === 'statement') text += ` → ${Object.values(STATEMENT).join(' · ')}`;
				if (f.type === 'todo') text += ` → ${f.count} пунктів`;
				if (f.type === 'matrix')
					text += ` → колонки: важливо · ${f.scale} 1–5 · пріоритет A/B/C<br>` +
						f.groups.map((g) => (g.name ? `*${g.name}:* ` : '') + g.items.join(' · ')).join('<br>');
				add(p.pages, part, TYPE[f.type], text, f.label);
			}
		}
	}
	return rows;
}

// --- зіставлення з OCR ---

// Скани йдуть підряд: IMG_6960 = с. 181 … IMG_6981 = с. 202
const FIRST_IMG = 6960, FIRST_PAGE = 181;

function ocrPages(md: string): Map<number, string[]> {
	const pages = new Map<number, string[]>();
	let cur: string[] | null = null;
	for (const raw of md.split('\n')) {
		const m = raw.match(/^<!-- IMG_(\d+)\.HEIC -->$/);
		if (m) pages.set(Number(m[1]) - FIRST_IMG + FIRST_PAGE, (cur = []));
		else if (cur && raw.trim()) cur.push(raw.trim());
	}
	return pages;
}

function pageRange(pages: string): number[] {
	const [a, b = a] = pages.split('–').map(Number);
	return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
function bigrams(s: string): Map<string, number> {
	const t = norm(s), m = new Map<string, number>();
	for (let i = 0; i < t.length - 1; i++) m.set(t.slice(i, i + 2), (m.get(t.slice(i, i + 2)) ?? 0) + 1);
	return m;
}
// Коефіцієнт Дайса на біграмах: стійкий до помилок OCR і переносів рядків
export function dice(a: string, b: string): number {
	const A = bigrams(a), B = bigrams(b);
	let shared = 0, total = 0;
	for (const [k, v] of A) { shared += Math.min(v, B.get(k) ?? 0); total += v; }
	for (const v of B.values()) total += v;
	return total ? (2 * shared) / total : 0;
}

// ponytail: перебір вікон 1–3 рядки на сторінці, O(рядків); семантичне зіставлення — якщо збіг часто < 40%
export function bestMatch(query: string, lines: string[]): { text: string; score: number } {
	let best = { text: '', score: 0 };
	for (let i = 0; i < lines.length; i++)
		for (let len = 1; len <= 3 && i + len <= lines.length; len++) {
			const text = lines.slice(i, i + len).join(' ');
			const score = dice(query, text);
			if (score > best.score) best = { text, score };
		}
	return best;
}

// --- вивід ---

const esc = (s: string) => s.replace(/\|/g, '\\|');
const HOWTO = 'Відповідай номерами: «12 ок» або «12 — інакше: …».';

function reviewMd(rows: Row[]): string {
	return [
		'# План перемоги: звірка формулювань', '',
		`Відкрий книжку на вказаній сторінці й порівняй. ${HOWTO}`, '',
		'| № | Стор. | Розділ | Тип | Моє формулювання |', '|---|---|---|---|---|',
		...rows.map((r) => `| ${r.n} | ${r.pages} | ${r.part} | ${r.type} | ${esc(r.text)} |`)
	].join('\n') + '\n';
}

function compareMd(rows: Row[], pages: Map<number, string[]>): string {
	const out = rows.map((r) => {
		const lines = pageRange(r.pages).flatMap((p) => pages.get(p) ?? []);
		const m = bestMatch(r.query, lines);
		const pct = Math.round(m.score * 100);
		return `| ${r.n} | ${r.pages} | ${esc(r.text)} | ${esc(m.text)} | ${pct < 40 ? `⚠️ ${pct}%` : `${pct}%`} |`;
	});
	return [
		'# План перемоги: моє формулювання і рядок з книжки', '',
		`Лише для тебе, не комітити. ⚠️ — збіг слабкий, звір вручну. ${HOWTO}`, '',
		'| № | Стор. | Моє формулювання | З книжки (OCR) | Збіг |', '|---|---|---|---|---|',
		...out
	].join('\n') + '\n';
}

function selfCheck() {
	const page = ['Додаток 1. План перемоги', 'Чи є у вас наставник?', 'Хто це може бути? Як налагодити', 'з ним контакт?', 'Вам щастить?'];
	console.assert(bestMatch('Є наставник?', page).text === 'Чи є у вас наставник?', 'одиночний рядок');
	console.assert(bestMatch('Хто це може бути і як вийти на контакт', page).text.includes('з ним контакт?'), 'склеювання переносу');
	console.assert(dice('абв', 'абв') === 1 && dice('абв', 'где') === 0, 'межі dice');
	console.assert(JSON.stringify(pageRange('183–185')) === '[183,184,185]', 'діапазон сторінок');
	console.log('self-check ok');
}

const args = process.argv.slice(2);
if (args.includes('--check')) selfCheck();
else {
	const rows = buildRows();
	writeFileSync('docs/plan-review.md', reviewMd(rows));
	console.log(`docs/plan-review.md: ${rows.length} рядків`);
	if (args.includes('--compare')) {
		if (!existsSync('ocr.md')) throw new Error('Немає ocr.md у корені проєкту');
		writeFileSync('docs/plan-compare.md', compareMd(rows, ocrPages(readFileSync('ocr.md', 'utf8'))));
		console.log('docs/plan-compare.md: готово (локальний файл, у git не йде)');
	}
}
