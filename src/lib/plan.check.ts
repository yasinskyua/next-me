// Самоперевірка відповідей: злиття зі збереженим і статус розділів. node src/lib/plan.check.ts
import assert from 'node:assert/strict';
import { PLAN, blankAnswers, merge, partStatus } from './plan.ts';

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
const swot = PLAN[1].parts[0]; // 2.1: SWOT, так/ні, тексти, дві заяви
assert.deepEqual(partStatus(swot, blank), { done: 0, total: 13 }, 'порожній бланк — нічого не заповнено');
assert.deepEqual(partStatus(swot, { ...blank, swot: { ...blank.swot, o: ' ' } }), { done: 0, total: 13 }, 'пробіли не рахуються');
assert.equal(partStatus(swot, m).done, 1, 'SWOT з одним квадратом — заповнене поле');
const skills = PLAN[2].parts[1]; // 3.2: таблиця навичок
assert.equal(partStatus(skills, m).done, 1, 'одна галочка в таблиці — поле заповнене');
console.log('plan.check ok');
