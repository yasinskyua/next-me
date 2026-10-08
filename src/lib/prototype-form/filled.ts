// ПРОТОТИП: чи заповнене поле — для лічильників у варіантах бланка
import type { Answers, Field, Part } from '#lib/plan.js';

const some = (v: unknown): boolean =>
	typeof v === 'string' ? v.trim() !== ''
	: typeof v === 'boolean' ? v
	: Array.isArray(v) ? v.some(some)
	: v && typeof v === 'object' ? Object.values(v).some(some)
	: false;

export const filled = (f: Field, answers: Answers) => f.type !== 'note' && some(answers[f.id]);

export function partStatus(part: Part, answers: Answers) {
	const questions = part.fields.filter((f) => f.type !== 'note');
	return { done: questions.filter((f) => filled(f, answers)).length, total: questions.length };
}
