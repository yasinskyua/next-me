// Самоперевірка злиття відповідей: node src/lib/plan.check.ts
import assert from 'node:assert/strict';
import { PLAN, blankAnswers, merge } from './plan.ts';

const blank = blankAnswers(PLAN);
assert.deepEqual(merge(blank, null), blank, 'нового користувача чекає порожній бланк');

const m = merge(blank, {
	goal: 'Стати №1',
	learn: ['Читання'],
	swot: { s: 'сила' },
	pride_done: ['перше'],
	skills: { 'Комунікації / Говорити': { on: true } },
	worth: 5,
	gone: 'поле, якого вже немає в бланку'
});
assert.equal(m.goal, 'Стати №1');
assert.deepEqual(m.learn, ['Читання']);
assert.deepEqual(m.swot, { s: 'сила', w: '', o: '', t: '' }, 'бракує ключів → порожні');
assert.deepEqual(m.pride_done, ['перше', '', ''], 'топ-3 добивається до трьох');
assert.deepEqual(m.skills['Комунікації / Говорити'], { on: true, score: '', prio: '' });
assert.deepEqual(m.skills['Комунікації / Слухати й чути'], { on: false, score: '', prio: '' });
assert.equal(m.worth, '', 'чужий тип → порожнє');
assert.equal(m.gone, 'поле, якого вже немає в бланку', 'старі дані не губляться');
assert.equal(m.stmt.name, '');
console.log('plan.check ok');
