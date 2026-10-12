import { parseRecipe, scaleText, formatDuration, guessEmoji, ingredientsUsedIn, plainText } from './parser.js';
import * as store from './store.js';
import * as timers from './timers.js';
import { RECIPE_PROMPT, SAMPLE_RECIPE } from './content.js';
import { icon } from './icons.js';

const app = document.getElementById('app');
const dock = document.getElementById('dock');
const bar = document.getElementById('bar');
const tray = document.getElementById('timer-tray');
const sheetRoot = document.getElementById('sheet-root');
const toastEl = document.getElementById('toast');
const darkQuery = matchMedia('(prefers-color-scheme: dark)');

// ---------- Look & feel ----------

const THEMES = {
  sourdough: { name: 'Sourdough', accent: '#B8622B', bg: '#FBF6EF', soft: '#F3E9DC', line: '#E8DAC6' },
  sage: { name: 'Sage', accent: '#4E7D50', bg: '#F5F7F1', soft: '#E7EDE0', line: '#D6E0CC' },
  tomato: { name: 'Tomato', accent: '#C9432F', bg: '#FCF5F2', soft: '#F6E4DD', line: '#EDD3CA' },
  blueberry: { name: 'Blueberry', accent: '#4361CF', bg: '#F4F6FC', soft: '#E5E9F7', line: '#D3DAF0' },
  plum: { name: 'Plum', accent: '#8746B3', bg: '#F8F4FB', soft: '#EDE4F4', line: '#DFD2EA' },
  teal: { name: 'Teal', accent: '#13777B', bg: '#F2F8F7', soft: '#E1EEEC', line: '#CDE2DF' },
  honey: { name: 'Honey', accent: '#A87700', bg: '#FCF8EC', soft: '#F5EDD3', line: '#EADFBD' },
  charcoal: { name: 'Charcoal', accent: '#2F2F2F', accentDark: '#ECE6DC', bg: '#F6F5F2', soft: '#EBE9E4', line: '#DDDAD3' },
};

const FONTS = {
  classic: { name: 'Classic', head: "'Fraunces', Georgia, serif", body: "'Nunito', system-ui, sans-serif" },
  modern: { name: 'Modern', head: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", body: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  rounded: { name: 'Rounded', head: "'Nunito', ui-rounded, system-ui, sans-serif", body: "'Nunito', ui-rounded, system-ui, sans-serif" },
  cookbook: { name: 'Cookbook', head: "'Fraunces', Georgia, serif", body: "'Fraunces', Georgia, serif" },
};

const TEXT_SIZES = { s: 0.92, m: 1, l: 1.12, xl: 1.26 };

function applyLook() {
  const s = store.settings;
  const theme = THEMES[s.theme] || THEMES.sourdough;
  const font = FONTS[s.font] || FONTS.classic;
  const root = document.documentElement;
  const dark = s.mode === 'dark' || (s.mode === 'auto' && darkQuery.matches);
  root.dataset.mode = dark ? 'dark' : 'light';
  root.dataset.cards = s.cards;
  const vars = {
    '--theme': theme.accent,
    '--accent-light': theme.accent,
    '--accent-dark': theme.accentDark || mix(theme.accent, '#ffffff', 0.38),
    '--bg-light': theme.bg,
    '--soft-light': theme.soft,
    '--line-light': theme.line,
    '--font-head': font.head,
    '--font-body': font.body,
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.style.fontSize = `${16 * (TEXT_SIZES[s.textSize] || 1)}px`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#141211' : theme.bg);
}

function mix(a, b, t) {
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

// ---------- Helpers ----------

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const truncate = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const hue = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 17);
const currentPrompt = () => store.settings.recipePrompt || RECIPE_PROMPT;

const TIME_RE = /\b\d+(?:[.,]\d+)?(?:\s*(?:-|–|to)\s*\d+(?:[.,]\d+)?)?\s*(?:hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/gi;
const TEMP_RE = /\b\d{2,3}\s*°\s*[CF]\b/g;

function markUp(html) {
  return html
    .replace(TIME_RE, m => `<span class="hl-time">${m}</span>`)
    .replace(TEMP_RE, m => `<span class="hl-temp">${m}</span>`);
}

// Paragraphs + bullet lists, with **bold** and optional time/temperature highlights.
function richText(text, highlight = false) {
  const out = [];
  let list = null;
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line) { list = null; continue; }
    const m = line.match(/^(?:[•\-*]|\d+[.)])\s+(.*)$/);
    let html = inline(m ? m[1] : line);
    if (highlight) html = markUp(html);
    if (m) {
      if (!list) out.push(list = []);
      list.push(html);
    } else {
      list = null;
      out.push(`<p>${html}</p>`);
    }
  }
  return out.map(x => (Array.isArray(x) ? `<ul>${x.map(li => `<li>${li}</li>`).join('')}</ul>` : x)).join('');
}

function clock(ms) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = n => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function totalTime(r) {
  const t = r.times.find(x => x.label === 'Total') || r.times[0];
  return t ? t.value : '';
}

function servingsLabel(r) {
  const scale = r.progress.scale || 1;
  const s = r.servings;
  if (!s?.count) return `×${+scale.toFixed(2)}`;
  const n = +(s.count * scale).toFixed(2);
  return s.label.replace(/(\d+(?:[.,]\d+)?)(\s*)([A-Za-z]+)?/, (m, _num, space, word = '') => `${n}${space}${n > 1 ? plural(word) : singular(word)}`);
}

const PLURALS = { loaf: 'loaves', batch: 'batches', dish: 'dishes', person: 'people' };
const COUNTABLE = /^(serving|portion|pizza|cake|tray|pan|bowl|cookie|muffin|roll|bun|baguette|pie|tart|bagel|pancake|waffle|slice|piece|cup|jar|burger|taco|sandwich|ball|boule)$/i;
function plural(word) {
  const w = word.toLowerCase();
  if (PLURALS[w]) return PLURALS[w];
  return COUNTABLE.test(w) ? `${word}s` : word;
}
function singular(word) {
  const w = word.toLowerCase();
  const back = Object.entries(PLURALS).find(([, pl]) => pl === w);
  if (back) return back[0];
  return /s$/i.test(w) && COUNTABLE.test(w.slice(0, -1)) ? word.slice(0, -1) : word;
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

function setBar(html, className = '') {
  bar.innerHTML = html;
  bar.className = className;
}

// ---------- Router ----------

let route = { view: '' };
let draft = null;
let stepDirection = 0;
let keepScroll = false;

function parseRoute() {
  const [view = '', id = null, extra = null] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  return { view, id, extra };
}

const VIEWS = { '': renderLibrary, new: renderEditor, edit: renderEditor, r: renderRecipe, cook: renderCook, settings: renderSettings };

function render() {
  route = parseRoute();
  closeSheet();
  setBar('');
  (VIEWS[route.view] || renderLibrary)(route.id, route.extra);
  document.body.dataset.view = route.view || 'library';
  if (route.view === 'cook') requestWakeLock();
  else releaseWakeLock();
  renderTray();
  if (!keepScroll) window.scrollTo(0, 0);
  keepScroll = false;
}

function rerender() {
  keepScroll = true;
  render();
}

function notFound() {
  app.innerHTML = `<main class="page"><div class="empty"><div class="empty-art">🤔</div><h1>Recipe not found</h1>
    <a class="btn primary" href="#/">Back to recipes</a></div></main>`;
}

// ---------- Library ----------

function renderLibrary() {
  const recipes = store.listRecipes();
  app.innerHTML = `
    <header class="topbar">
      <div class="brand">${icon('chef')}<span>Mise</span></div>
      <span class="spacer"></span>
      <button class="icon-btn" data-action="go" data-to="#/settings" aria-label="Look and settings">${icon('palette')}</button>
    </header>
    <main class="page">
      ${recipes.length ? `
        <h1 class="page-title">Your recipes</h1>
        ${recipes.length > 4 ? `<label class="search">${icon('search')}<input type="search" placeholder="Search recipes" data-input="search" aria-label="Search recipes"></label>` : ''}
        <div class="recipe-grid">${recipes.map(recipeCard).join('')}</div>
      ` : `
        <div class="empty">
          <div class="empty-art">🍞</div>
          <h1>Cook without scrolling back</h1>
          <p>Paste a recipe prompt and get big, simple steps with built-in timers.</p>
          <button class="btn primary big" data-action="go" data-to="#/new">${icon('plus')} Add your first recipe</button>
          <button class="btn ghost" data-action="sample">Try a sample bread recipe</button>
        </div>
      `}
    </main>`;
  if (recipes.length) setBar(`<button class="btn primary big fab" data-action="go" data-to="#/new">${icon('plus')}<span>Add recipe</span></button>`, 'action-bar end');
}

function recipeCard(r) {
  const meta = [`${r.steps.length} steps`, totalTime(r)].filter(Boolean).join(' · ');
  const step = r.progress?.step || 0;
  const inProgress = step > 0 && step < r.steps.length;
  return `
    <a class="recipe-card" href="#/r/${esc(r.id)}" data-title="${esc(r.title.toLowerCase())}">
      <div class="card-art" style="--h:${hue(r.title)}">${esc(r.emoji || '🍳')}</div>
      <div class="card-body">
        <h3>${esc(r.title)}</h3>
        <p class="muted">${esc(meta)}</p>
        ${inProgress ? `<span class="pill">On step ${step + 1} of ${r.steps.length}</span>` : ''}
      </div>
      ${icon('chevron-right')}
    </a>`;
}

// ---------- Add / edit ----------

function renderEditor(id) {
  const existing = id ? store.getRecipe(id) : null;
  if (id && !existing) return notFound();
  app.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-action="go" data-to="${existing ? `#/r/${existing.id}` : '#/'}" aria-label="Back">${icon('arrow-left')}</button>
      <h1 class="topbar-title">${existing ? 'Edit recipe' : 'Add a recipe'}</h1>
      <span class="spacer"></span>
    </header>
    <main class="page editor">
      <section class="card how">
        <div class="how-step"><span class="num">1</span><div>
          <h3>Get the recipe in app format</h3>
          <p class="muted">Copy this prompt and send it to your AI assistant in the same chat as your recipe.</p>
        </div></div>
        <button class="btn secondary" data-action="copy-prompt">${icon('copy')} Copy recipe prompt</button>
        <details><summary>See the prompt</summary><pre class="prompt-preview">${esc(currentPrompt())}</pre></details>
        <div class="how-step"><span class="num">2</span><div>
          <h3>Paste the answer below</h3>
          <p class="muted">Any recipe text works too. Mise will do its best to read it.</p>
        </div></div>
      </section>
      <div class="paste-box">
        <textarea data-input="source" placeholder="Paste the recipe here…" spellcheck="false" aria-label="Recipe text">${esc(existing?.source || '')}</textarea>
        <div class="paste-actions">
          <button class="btn secondary" data-action="paste">${icon('clipboard')} Paste</button>
          <button class="btn ghost" data-action="clear-source">Clear</button>
        </div>
      </div>
      <section id="preview" class="preview" aria-live="polite"></section>
    </main>`;
  setBar(`<button class="btn primary big grow" data-action="save-recipe" ${existing ? `data-id="${existing.id}"` : ''} disabled>${icon('check')} Save recipe</button>`, 'action-bar');
  updatePreview();
}

function updatePreview() {
  const ta = app.querySelector('[data-input="source"]');
  const out = document.getElementById('preview');
  const save = bar.querySelector('[data-action="save-recipe"]');
  if (!ta || !out) return;
  draft = ta.value.trim() ? parseRecipe(ta.value) : null;
  if (save) save.disabled = !draft?.steps.length;
  if (!draft) {
    out.innerHTML = '';
    return;
  }
  const ingCount = draft.ingredients.reduce((n, g) => n + g.items.length, 0);
  const timerCount = draft.steps.reduce((n, s) => n + s.timers.length, 0);
  out.innerHTML = `
    <div class="card preview-card">
      <div class="preview-head">
        <span class="emoji">${guessEmoji(draft)}</span>
        <div>
          <small class="preview-label">Preview</small>
          <h3>${esc(draft.title)}</h3>
          <p class="muted">${ingCount} ingredients · ${draft.steps.length} steps${timerCount ? ` · ${timerCount} timers` : ''}</p>
        </div>
      </div>
      ${draft.warnings.map(w => `<p class="warn">${esc(w)}</p>`).join('')}
      ${draft.steps.length ? `
        <ol class="preview-steps">${draft.steps.slice(0, 4).map(s => `<li>${esc(s.title || truncate(plainText(s.text), 70))}</li>`).join('')}</ol>
        ${draft.steps.length > 4 ? `<p class="muted small">…and ${draft.steps.length - 4} more</p>` : ''}` : ''}
    </div>`;
}

function saveParsed(parsed, source, existing = null) {
  const { warnings, ...data } = parsed;
  return store.saveRecipe({
    ...data,
    id: existing?.id,
    source,
    emoji: guessEmoji(data),
    progress: { step: 0, checked: [], scale: existing?.progress?.scale || 1 },
  });
}

// ---------- Recipe page ----------

function renderRecipe(id) {
  const r = store.getRecipe(id);
  if (!r) return notFound();
  store.patchRecipe(id, { lastOpened: Date.now() });
  const p = r.progress;
  const started = p.step > 0 && p.step < r.steps.length;

  let lastPhase = '';
  const stepRows = r.steps.map((s, i) => {
    const phaseHead = s.phase && s.phase !== lastPhase ? `<li class="phase-head">${esc(s.phase)}</li>` : '';
    lastPhase = s.phase;
    return `${phaseHead}
      <li><button class="step-row ${i < p.step ? 'done' : ''}" data-action="cook" data-id="${r.id}" data-step="${i}">
        <span class="step-dot">${i < p.step ? icon('check') : i + 1}</span>
        <span class="step-row-body">
          <strong>${esc(s.title || truncate(plainText(s.text), 60))}</strong>
          ${s.title && s.text ? `<span class="muted clamp">${esc(plainText(s.text))}</span>` : ''}
        </span>
        ${s.timers.length ? `<span class="mini-timer">${icon('timer')}${esc(formatDuration(s.timers[0].minutes))}</span>` : ''}
      </button></li>`;
  }).join('');

  app.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-action="go" data-to="#/" aria-label="All recipes">${icon('arrow-left')}</button>
      <span class="spacer"></span>
      <button class="icon-btn" data-action="go" data-to="#/edit/${r.id}" aria-label="Edit recipe">${icon('edit')}</button>
      <button class="icon-btn" data-action="delete-recipe" data-id="${r.id}" aria-label="Delete recipe">${icon('trash')}</button>
    </header>
    <main class="page recipe">
      <div class="hero">
        <div class="hero-art" style="--h:${hue(r.title)}">${esc(r.emoji || '🍳')}</div>
        <h1 class="recipe-title">${esc(r.title)}</h1>
        ${r.description ? `<p class="lede">${inline(r.description)}</p>` : ''}
        ${r.times.length ? `<div class="chips">${r.times.map(t => `<span class="chip">${icon('clock')}<b>${esc(t.label)}</b>${esc(t.value)}</span>`).join('')}</div>` : ''}
      </div>

      <div class="servings card">
        <div><small class="muted">${r.servings?.count ? 'Makes' : 'Recipe size'}</small><strong>${esc(servingsLabel(r))}</strong></div>
        <div class="stepper">
          <button class="icon-btn" data-action="scale" data-id="${r.id}" data-dir="-1" aria-label="Make less">${icon('minus')}</button>
          <button class="icon-btn" data-action="scale" data-id="${r.id}" data-dir="1" aria-label="Make more">${icon('plus')}</button>
        </div>
      </div>

      ${r.ingredients.length ? `
      <section class="section">
        <div class="section-head"><h2>Ingredients</h2><span class="muted" data-ing-count="${r.id}">${ingCountText(r)}</span></div>
        ${ingredientList(r)}
      </section>` : ''}

      ${r.equipment?.length ? `
      <section class="section">
        <div class="section-head"><h2>Equipment</h2></div>
        <ul class="plain-list">${r.equipment.map(e => `<li>${inline(e)}</li>`).join('')}</ul>
      </section>` : ''}

      <section class="section">
        <div class="section-head"><h2>Steps</h2><span class="muted">${r.steps.length} steps</span></div>
        <ol class="step-list">${stepRows}</ol>
      </section>

      ${r.notes?.length ? `
      <section class="section">
        <div class="section-head"><h2>Notes & tips</h2></div>
        <ul class="note-list">${r.notes.map(n => `<li>${inline(n)}</li>`).join('')}</ul>
      </section>` : ''}
    </main>`;

  setBar(`<button class="btn primary big grow" data-action="cook" data-id="${r.id}" data-step="${started ? p.step : 0}">
      ${icon('play')} ${started ? `Continue · step ${p.step + 1} of ${r.steps.length}` : 'Start cooking'}</button>`, 'action-bar');
}

function ingCountText(r) {
  const total = r.ingredients.reduce((n, g) => n + g.items.length, 0);
  const done = r.progress.checked.length;
  return done ? `${done} of ${total} ready` : `${total} items`;
}

function ingredientList(r) {
  const checked = new Set(r.progress.checked);
  const scale = r.progress.scale || 1;
  return r.ingredients.map((g, gi) => `
    ${g.name ? `<h3 class="group-name">${esc(g.name)}</h3>` : ''}
    <ul class="ingredients">${g.items.map((item, ii) => {
      const key = `${gi}.${ii}`;
      return `<li><button class="ing ${checked.has(key) ? 'checked' : ''}" data-action="toggle-ing" data-id="${r.id}" data-key="${key}" aria-pressed="${checked.has(key)}">
        <span class="box">${icon('check')}</span><span>${inline(scaleText(item, scale))}</span></button></li>`;
    }).join('')}</ul>`).join('');
}

// ---------- Cook mode ----------

function renderCook(id, stepStr) {
  const r = store.getRecipe(id);
  if (!r) return notFound();
  const total = r.steps.length;
  const i = clamp(parseInt(stepStr, 10) || 0, 0, total);
  store.patchRecipe(id, { progress: { ...r.progress, step: i }, ...(i === total ? { lastCooked: Date.now() } : {}) });
  if (i === total) return renderFinished(r);

  const list = store.settings.cookLayout === 'list';
  const top = `
    <header class="cook-top">
      <button class="icon-btn" data-action="go" data-to="#/r/${r.id}" aria-label="Leave cook mode">${icon('x')}</button>
      <div class="cook-progress-text"><strong>Step ${i + 1}</strong> of ${total}</div>
      <button class="icon-btn" data-action="ingredients-sheet" data-id="${r.id}" aria-label="Show ingredients">${icon('list')}</button>
    </header>
    <div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${i + 1}"><span style="width:${((i + 1) / total) * 100}%"></span></div>`;

  if (list) {
    app.innerHTML = `<div class="cook">${top}
      <main class="cook-list">${r.steps.map((s, k) => `
        <article class="card list-step ${k < i ? 'done' : ''} ${k === i ? 'current' : ''}" id="step-${k}">
          ${cookStep(r, k)}
          ${k === i
            ? `<button class="btn primary" data-action="cook" data-id="${r.id}" data-step="${k + 1}">${k === total - 1 ? 'Finish' : 'Done, next'} ${icon('check')}</button>`
            : `<button class="btn ghost small" data-action="cook" data-id="${r.id}" data-step="${k}">${k < i ? 'Go back to this step' : 'Jump to this step'}</button>`}
        </article>`).join('')}
      </main></div>`;
    requestAnimationFrame(() => document.getElementById(`step-${i}`)?.scrollIntoView({ block: 'center', behavior: keepScroll ? 'auto' : 'smooth' }));
  } else {
    const anim = stepDirection > 0 ? 'from-right' : stepDirection < 0 ? 'from-left' : '';
    app.innerHTML = `<div class="cook">${top}
      <main class="cook-stage ${anim}" data-swipe>${cookStep(r, i)}</main></div>`;
    setBar(`
      <button class="btn secondary big" data-action="cook" data-id="${r.id}" data-step="${i - 1}" ${i === 0 ? 'disabled' : ''} aria-label="Previous step">${icon('arrow-left')}</button>
      <button class="btn primary big grow" data-action="cook" data-id="${r.id}" data-step="${i + 1}">
        ${i === total - 1 ? `Finish ${icon('check')}` : `Next step ${icon('arrow-right')}`}</button>`, 'action-bar');
  }
  stepDirection = 0;
}

function stepBody(step, number, { text = step.text, timersHtml = '', usedHtml = '' } = {}) {
  return `
    ${step.phase ? `<div class="phase">${esc(step.phase)}</div>` : ''}
    <div class="step-head">
      <span class="step-badge">${number}</span>
      ${step.title ? `<h2 class="step-title">${esc(step.title)}</h2>` : ''}
    </div>
    ${text ? `<div class="step-text ${step.title ? '' : 'big'}">${richText(text, store.settings.highlightTimes)}</div>` : ''}
    ${timersHtml}
    ${usedHtml}
    ${step.tip ? `<aside class="tip">${icon('bulb')}<div>${inline(step.tip)}</div></aside>` : ''}`;
}

function cookStep(r, i) {
  const s = r.steps[i];
  const scale = r.progress.scale || 1;
  const used = store.settings.stepIngredients ? ingredientsUsedIn(r, s) : [];
  return stepBody(s, i + 1, {
    text: scale !== 1 ? scaleText(s.text, scale, { unitsOnly: true }) : s.text,
    timersHtml: s.timers.length ? `<div class="timer-chips" data-id="${r.id}" data-step="${i}">${timerChips(r, i)}</div>` : '',
    usedHtml: used.length ? `<div class="used"><small>You'll need</small><div class="used-list">${used.map(u => `<span class="chip">${inline(scaleText(u, scale))}</span>`).join('')}</div></div>` : '',
  });
}

function timerChips(r, i) {
  return r.steps[i].timers.map((t, ti) => {
    const running = timers.findTimer(`${r.id}:${i}:${ti}`);
    if (running) {
      const paused = running.pausedLeft != null;
      return `<button class="timer-chip running ${running.done ? 'done' : ''}" data-action="${running.done ? 'timer-remove' : 'timer-toggle'}" data-timer="${running.id}">
        ${running.done ? icon('check') : icon(paused ? 'play' : 'pause')}
        <span data-countdown="${running.id}">${running.done ? "Time's up!" : clock(timers.remaining(running))}</span>
        ${running.done ? '<small>Tap to stop</small>' : paused ? '<small>Paused</small>' : t.label ? `<small>${esc(t.label)}</small>` : ''}
      </button>`;
    }
    return `<button class="timer-chip" data-action="start-timer" data-id="${r.id}" data-step="${i}" data-ti="${ti}">
      ${icon('timer')}<span>Start ${esc(formatDuration(t.minutes))}</span>${t.label ? `<small>${esc(t.label)}</small>` : ''}
    </button>`;
  }).join('');
}

function refreshTimerChips() {
  app.querySelectorAll('.timer-chips[data-step]').forEach(el => {
    const r = store.getRecipe(el.dataset.id);
    if (r) el.innerHTML = timerChips(r, Number(el.dataset.step));
  });
}

function renderFinished(r) {
  app.innerHTML = `
    <main class="finished">
      <div class="big-emoji">🎉</div>
      <h1>All done!</h1>
      <p class="muted">Enjoy your ${esc(r.title)}. ${esc(r.emoji || '')}</p>
      <div class="actions">
        <a class="btn primary big" href="#/r/${r.id}">Back to recipe</a>
        <button class="btn secondary" data-action="cook" data-id="${r.id}" data-step="0">${icon('restart')} Cook it again</button>
        <a class="btn ghost" href="#/">All recipes</a>
      </div>
    </main>`;
}

function goToStep(id, step) {
  const r = store.getRecipe(id);
  if (!r) return;
  const target = clamp(step, 0, r.steps.length);
  const url = `#/cook/${id}/${target}`;
  if (route.view === 'cook') {
    stepDirection = Math.sign(target - (parseInt(route.extra, 10) || 0));
    location.replace(url);
  } else {
    stepDirection = 0;
    location.hash = url;
  }
}

// ---------- Settings ----------

function renderSettings() {
  const s = store.settings;
  const segmented = (key, options, extraClass = '', styleFor = null) => `
    <div class="segmented ${extraClass}" role="radiogroup">${options.map(([value, label]) => `
      <button role="radio" aria-checked="${s[key] === value}" class="${s[key] === value ? 'on' : ''}" data-action="set" data-key="${key}" data-value="${value}" ${styleFor ? `style="font-family:${styleFor(value)}"` : ''}>${label}</button>`).join('')}
    </div>`;
  const toggle = (key, label, hint = '') => `
    <button class="toggle-row" role="switch" aria-checked="${!!s[key]}" data-action="toggle-setting" data-key="${key}">
      <span><span class="toggle-label">${label}</span>${hint ? `<small class="muted">${hint}</small>` : ''}</span><span class="switch"></span>
    </button>`;
  const sample = {
    phase: 'Shaping',
    title: 'Shape the loaf',
    text: 'Tip the dough onto a floured surface, fold the edges in and let it rest for 10 minutes. Bake at 230°C (450°F).',
    tip: '',
  };

  app.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-action="go" data-to="#/" aria-label="Back">${icon('arrow-left')}</button>
      <h1 class="topbar-title">Look & settings</h1>
      <span class="spacer"></span>
    </header>
    <main class="page settings">
      <section class="card preview-pane" aria-label="Live preview">
        ${stepBody(sample, 3, { timersHtml: `<div class="timer-chips"><span class="timer-chip">${icon('timer')}<span>Start 10 min</span><small>Bench rest</small></span></div>` })}
      </section>

      <section class="setting-group">
        <h2>Colour</h2>
        <div class="swatches">${Object.entries(THEMES).map(([k, t]) => `
          <button class="swatch ${s.theme === k ? 'on' : ''}" data-action="set" data-key="theme" data-value="${k}" style="--sw:${t.accent}" aria-pressed="${s.theme === k}"><span></span>${t.name}</button>`).join('')}
        </div>
      </section>

      <section class="setting-group">
        <h2>Style</h2>
        <div class="setting"><span class="setting-label">Light or dark</span>${segmented('mode', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']])}</div>
        <div class="setting"><span class="setting-label">Font</span>${segmented('font', Object.entries(FONTS).map(([k, f]) => [k, f.name]), 'two-col', v => FONTS[v].head.replace(/"/g, "'"))}</div>
        <div class="setting"><span class="setting-label">Text size</span>${segmented('textSize', [['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL']])}</div>
        <div class="setting"><span class="setting-label">Cards</span>${segmented('cards', [['soft', 'Soft & rounded'], ['flat', 'Flat & crisp']])}</div>
      </section>

      <section class="setting-group">
        <h2>Cook mode</h2>
        <div class="setting"><span class="setting-label">Layout</span>${segmented('cookLayout', [['cards', 'One step at a time'], ['list', 'All steps in a list']])}</div>
        <div class="card setting-card">
          ${toggle('stepIngredients', 'Show what each step needs', 'Lists the ingredients mentioned in the step')}
          ${toggle('highlightTimes', 'Highlight times & temperatures')}
          ${toggle('keepAwake', 'Keep the screen on while cooking')}
          ${toggle('timerSound', 'Alarm sound when a timer ends')}
          ${toggle('vibrate', 'Vibrate when a timer ends')}
        </div>
        <button class="btn ghost small" data-action="test-alarm">${icon('timer')} Test the alarm</button>
      </section>

      <section class="setting-group">
        <h2>Recipe prompt</h2>
        <p class="muted hint">This is what “Copy recipe prompt” copies. You can change it, for example to ask for metric units only.</p>
        <textarea class="mono" data-input="prompt" aria-label="Recipe prompt">${esc(currentPrompt())}</textarea>
        <div class="row"><button class="btn secondary small" data-action="copy-prompt">${icon('copy')} Copy</button>
        <button class="btn ghost small" data-action="reset-prompt">${icon('restart')} Restore original</button></div>
      </section>

      <section class="setting-group">
        <h2>Your recipes</h2>
        <p class="muted hint">Recipes are saved on this device only. Export a backup to move them to another phone.</p>
        <div class="row wrap">
          <button class="btn secondary small" data-action="export">${icon('download')} Export backup</button>
          <label class="btn secondary small">${icon('upload')} Import backup<input type="file" accept="application/json,.json" data-change="import" hidden></label>
          <button class="btn ghost small" data-action="sample">Add sample recipe</button>
        </div>
      </section>

      <section class="setting-group">
        <h2>Put it on your home screen</h2>
        <div class="card install">
          <p><b>iPhone (Safari):</b> tap the Share button, then <b>Add to Home Screen</b>.</p>
          <p><b>Android (Chrome):</b> tap the ⋮ menu, then <b>Add to Home screen</b> or <b>Install app</b>.</p>
        </div>
      </section>

      <button class="btn ghost small reset" data-action="reset-look">${icon('restart')} Reset the look to default</button>
    </main>`;
}

// ---------- Sheets ----------

function openSheet(title, html) {
  sheetRoot.innerHTML = `
    <div class="sheet-backdrop" data-action="close-sheet"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-handle"></div>
      <div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">${icon('x')}</button></div>
      <div class="sheet-body">${html}</div>
    </div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => sheetRoot.classList.add('open')));
}

function closeSheet() {
  sheetRoot.classList.remove('open');
  sheetRoot.innerHTML = '';
}

// ---------- Timer tray ----------

function renderTray() {
  const list = timers.getTimers();
  tray.innerHTML = list.map(t => {
    const paused = t.pausedLeft != null;
    return `
      <div class="tray-timer ${t.done ? 'done' : ''} ${paused ? 'paused' : ''}">
        <a class="tray-info" href="${t.recipeId ? `#/r/${t.recipeId}` : '#/'}">
          <small>${esc(t.recipeTitle || 'Timer')}</small><strong>${esc(t.label)}</strong>
        </a>
        <span class="tray-time" data-countdown="${t.id}">${t.done ? "Time's up!" : clock(timers.remaining(t))}</span>
        ${t.done
          ? `<button class="btn small stop" data-action="timer-remove" data-timer="${t.id}">Stop</button>`
          : `<button class="icon-btn small" data-action="timer-toggle" data-timer="${t.id}" aria-label="${paused ? 'Resume' : 'Pause'} timer">${icon(paused ? 'play' : 'pause')}</button>
             <button class="icon-btn small" data-action="timer-add" data-timer="${t.id}" aria-label="Add one minute">+1</button>
             <button class="icon-btn small" data-action="timer-remove" data-timer="${t.id}" aria-label="Cancel timer">${icon('x')}</button>`}
      </div>`;
  }).join('');
}

timers.onTimersChange((list, tickOnly) => {
  if (!tickOnly) {
    renderTray();
    refreshTimerChips();
    return;
  }
  document.querySelectorAll('[data-countdown]').forEach(el => {
    const t = list.find(x => x.id === el.dataset.countdown);
    if (t && !t.done) el.textContent = clock(timers.remaining(t));
  });
});

// ---------- Screen wake lock ----------

let wakeLock = null;

async function requestWakeLock() {
  if (!store.settings.keepAwake || !('wakeLock' in navigator) || (wakeLock && !wakeLock.released)) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch { /* not allowed right now (e.g. low battery) */ }
}

function releaseWakeLock() {
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && route.view === 'cook') requestWakeLock();
});

// ---------- Actions ----------

const actions = {
  go: el => { location.hash = el.dataset.to; },

  sample() {
    const rec = saveParsed(parseRecipe(SAMPLE_RECIPE), SAMPLE_RECIPE);
    location.hash = `#/r/${rec.id}`;
  },

  async 'copy-prompt'() {
    const ok = await copyText(currentPrompt());
    toast(ok ? 'Prompt copied! Paste it into your AI chat.' : "Couldn't copy. Open “See the prompt” and copy it by hand.");
  },

  async paste() {
    const ta = app.querySelector('[data-input="source"]');
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return toast('Your clipboard is empty');
      ta.value = text;
      updatePreview();
    } catch {
      ta.focus();
      toast('Long-press the box and tap Paste');
    }
  },

  'clear-source'() {
    const ta = app.querySelector('[data-input="source"]');
    ta.value = '';
    updatePreview();
    ta.focus();
  },

  'save-recipe'(el) {
    if (!draft?.steps.length) return;
    const source = app.querySelector('[data-input="source"]').value;
    const rec = saveParsed(draft, source, el.dataset.id ? store.getRecipe(el.dataset.id) : null);
    location.replace(`#/r/${rec.id}`);
    toast('Recipe saved');
  },

  'delete-recipe'(el) {
    const r = store.getRecipe(el.dataset.id);
    openSheet('Delete this recipe?', `
      <p class="sheet-text">“${esc(r.title)}” will be removed from this device.</p>
      <div class="confirm-actions">
        <button class="btn secondary big" data-action="close-sheet">Keep it</button>
        <button class="btn danger big" data-action="confirm-delete" data-id="${r.id}">${icon('trash')} Delete</button>
      </div>`);
  },

  'confirm-delete'(el) {
    store.deleteRecipe(el.dataset.id);
    location.hash = '#/';
    toast('Recipe deleted');
  },

  cook: el => goToStep(el.dataset.id || route.id, Number(el.dataset.step) || 0),

  'toggle-ing'(el) {
    const r = store.getRecipe(el.dataset.id);
    const key = el.dataset.key;
    const checked = new Set(r.progress.checked);
    if (checked.has(key)) checked.delete(key);
    else checked.add(key);
    store.patchRecipe(r.id, { progress: { ...r.progress, checked: [...checked] } });
    document.querySelectorAll(`[data-action="toggle-ing"][data-key="${key}"]`).forEach(b => {
      b.classList.toggle('checked', checked.has(key));
      b.setAttribute('aria-pressed', checked.has(key));
    });
    document.querySelectorAll(`[data-ing-count="${r.id}"]`).forEach(c => { c.textContent = ingCountText(r); });
  },

  scale(el) {
    const r = store.getRecipe(el.dataset.id);
    const dir = Number(el.dataset.dir);
    const scale = r.progress.scale || 1;
    const count = r.servings?.count;
    let next;
    if (count) {
      const stepSize = count <= 2 ? 0.5 : 1;
      const n = Math.max(stepSize, Math.round((count * scale) / stepSize) * stepSize + dir * stepSize);
      next = n / count;
    } else {
      next = Math.max(0.5, scale + dir * 0.5);
    }
    store.patchRecipe(r.id, { progress: { ...r.progress, scale: next } });
    rerender();
  },

  'ingredients-sheet'(el) {
    const r = store.getRecipe(el.dataset.id);
    openSheet('Ingredients', `<p class="muted sheet-sub">${esc(servingsLabel(r))} · <span data-ing-count="${r.id}">${ingCountText(r)}</span></p>${ingredientList(r)}`);
  },

  'close-sheet': closeSheet,

  'start-timer'(el) {
    const r = store.getRecipe(el.dataset.id);
    const si = Number(el.dataset.step);
    const ti = Number(el.dataset.ti);
    const t = r.steps[si].timers[ti];
    timers.startTimer({
      key: `${r.id}:${si}:${ti}`,
      minutes: t.minutes,
      label: (!t.auto && t.label) || r.steps[si].title || t.label || `Step ${si + 1}`,
      recipeId: r.id,
      recipeTitle: r.title,
    });
    toast(`Timer started: ${formatDuration(t.minutes)}`);
  },

  'timer-toggle': el => timers.togglePause(el.dataset.timer),
  'timer-add': el => timers.addMinute(el.dataset.timer),
  'timer-remove': el => timers.removeTimer(el.dataset.timer),

  'test-alarm'() {
    timers.beep();
    if (store.settings.vibrate) navigator.vibrate?.([300, 150, 300]);
  },

  set(el) {
    store.updateSettings({ [el.dataset.key]: el.dataset.value });
    applyLook();
    rerender();
  },

  'toggle-setting'(el) {
    const key = el.dataset.key;
    store.updateSettings({ [key]: !store.settings[key] });
    rerender();
  },

  'reset-prompt'() {
    store.updateSettings({ recipePrompt: '' });
    rerender();
    toast('Original prompt restored');
  },

  'reset-look'() {
    store.resetLook();
    applyLook();
    rerender();
    toast('Look reset');
  },

  export() {
    const blob = new Blob([JSON.stringify(store.exportRecipes(), null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `mise-recipes-${new Date().toISOString().slice(0, 10)}.json`,
    });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (!fn) return;
  e.preventDefault();
  fn(el, e);
});

let inputTimer = null;
const inputs = {
  source: () => {
    clearTimeout(inputTimer);
    inputTimer = setTimeout(updatePreview, 250);
  },
  prompt: el => {
    clearTimeout(inputTimer);
    inputTimer = setTimeout(() => store.updateSettings({ recipePrompt: el.value.trim() === RECIPE_PROMPT.trim() ? '' : el.value }), 400);
  },
  search: el => {
    const q = el.value.trim().toLowerCase();
    app.querySelectorAll('.recipe-card').forEach(card => { card.hidden = q && !card.dataset.title.includes(q); });
  },
};

document.addEventListener('input', e => {
  const key = e.target.dataset?.input;
  if (key && inputs[key]) inputs[key](e.target);
});

document.addEventListener('change', async e => {
  if (e.target.dataset?.change !== 'import') return;
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const added = store.importRecipes(JSON.parse(await file.text()));
    toast(added ? `Imported ${added} recipe${added === 1 ? '' : 's'}` : 'No new recipes in that file');
  } catch {
    toast("That file doesn't look like a Mise backup");
  }
  e.target.value = '';
});

// Swipe left/right between steps in cook mode.
let touchStart = null;
document.addEventListener('touchstart', e => {
  if (!e.target.closest('[data-swipe]')) return;
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });
document.addEventListener('touchend', e => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) stepBy(dx < 0 ? 1 : -1);
}, { passive: true });

document.addEventListener('keydown', e => {
  if (route.view !== 'cook' || e.target.closest('input, textarea')) return;
  if (e.key === 'ArrowRight') stepBy(1);
  if (e.key === 'ArrowLeft') stepBy(-1);
  if (e.key === 'Escape') location.hash = `#/r/${route.id}`;
});

function stepBy(delta) {
  if (route.view !== 'cook') return;
  const current = parseInt(route.extra, 10) || 0;
  if (current + delta < 0) return;
  goToStep(route.id, current + delta);
}

// Browsers only allow sound after a tap.
document.addEventListener('pointerdown', timers.unlockAudio, { passive: true });

// Keep page content clear of the bottom bar + timers.
new ResizeObserver(() => document.documentElement.style.setProperty('--dock-h', `${dock.offsetHeight}px`)).observe(dock);

darkQuery.addEventListener('change', applyLook);
window.addEventListener('hashchange', render);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

applyLook();
render();
