// Сервера на GitHub Pages немає: усе рендериться в браузері.
// prerender кладе порожню оболонку кожної сторінки (код 200), решту адрес ловить 404.html.
export const ssr = false;
export const prerender = true;
