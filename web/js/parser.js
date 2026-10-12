// Turns pasted recipe text into a structured recipe.
// Understands the JSON format our recipe prompt asks for, and falls back to
// reading ordinary markdown / plain-text recipes (headings, bullets, numbered steps).

const FRACTION_CHARS = { '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4, '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8 };

// Friendly filler AI assistants like to add around a recipe.
const CHATTER = /^(enjoy\b|let me know|happy (baking|cooking)|i hope|hope you|feel free|would you like|bon app[eé]tit|(okay|ok|sure|great|absolutely|of course|alright)[,!.]|here'?s (a|an|the|your|how)\b|here is (a|an|the|your)\b)/i;

const STEP_HEADING = /^(step\s*\d+|\d+[.)])(\s|:|$)/i;
const STEP_PREFIX = /^(?:step\s*)?\d+\s*[:.)\-–—]?\s*/i;

const META = /^(prep(?:aration)?(?: time)?|active time|hands[- ]on time|cook(?:ing)? time|bak(?:e|ing) time|ris(?:e|ing) time|proof(?:ing)? time|rest(?:ing)? time|total(?: time)?|servings?|serves|yield|makes)\s*[:\-–—]\s*(.+)$/i;

// ---------- Public API ----------

// Caps keep a giant paste from freezing the phone (all parsing is line-by-line).
const MAX_INPUT = 100_000;
const MAX_LINE = 4_000;

export function parseRecipe(raw) {
  const text = String(raw ?? '')
    .slice(0, MAX_INPUT)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.slice(0, MAX_LINE))
    .join('\n')
    .trim();
  if (!text) return null;
  const json = extractJson(text);
  const recipe = json ? fromJson(json) : fromText(text);
  for (const step of recipe.steps) {
    if (!step.timers.length) step.timers = findTimers(`${step.title}. ${step.text}`);
  }
  recipe.warnings = [];
  if (!recipe.ingredients.some(g => g.items.length)) recipe.warnings.push("I couldn't find an ingredients list.");
  if (!recipe.steps.length) recipe.warnings.push("I couldn't find any steps yet.");
  return recipe;
}

export function plainText(s) {
  return String(s ?? '').replace(/\*\*|__|`/g, '').replace(/^\s*[•\-*]\s+/gm, '').replace(/\s+/g, ' ').trim();
}

export function formatDuration(min) {
  if (!(min > 0)) return '';
  if (min < 1) return `${Math.round(min * 60)} sec`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Finds durations like "20 minutes", "1-2 hours", "1 hour 30 min", "half an hour".
export function findTimers(text) {
  let s = plainText(text);
  const found = [];
  const add = (minutes, label) => {
    if (minutes > 0 && minutes <= 72 * 60 && !found.some(t => t.minutes === minutes)) found.push({ minutes, label, auto: true });
  };
  s = s.replace(/\b(\d+(?:[.,]\d+)?)\s*(?:hours?|hrs?|h)\s*(?:and\s*)?(\d+)\s*(?:minutes?|mins?|m)\b/gi, (m, h, min) => {
    add(num(h) * 60 + Number(min), m.trim());
    return ' '.repeat(m.length);
  });
  const SPAN = /\b(\d*[½¼¾]|\d+(?:[.,]\d+)?|half an?|an?)\s*(?:(?:-|–|—|to|or)\s*(\d+(?:[.,]\d+)?)\s*)?(hours?|hrs?|minutes?|mins?|seconds?|secs?|h)\b/gi;
  for (const m of s.matchAll(SPAN)) {
    const unit = m[3].toLowerCase();
    const factor = unit.startsWith('h') ? 60 : unit.startsWith('s') ? 1 / 60 : 1;
    const first = /^half/i.test(m[1]) ? 0.5 : /^an?$/i.test(m[1]) ? 1 : parseQty(m[1]);
    add(Math.round(first * factor * 100) / 100, m[0].trim().replace(/\s*-\s*/, '–'));
  }
  return found.slice(0, 3);
}

// Multiplies quantities in an ingredient line ("500 g flour" ×2 → "1000 g flour").
// unitsOnly: only touch numbers followed by a unit (used for step text).
const QTY = '(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d*[½⅓⅔¼¾⅛⅜⅝⅞]|\\d+(?:[.,]\\d+)?)';
const QTY_RE = new RegExp(`(${QTY})(\\s*(?:-|–|to)\\s*(${QTY}))?`, 'g');
const UNIT_AFTER = /^\s*(g|grams?|kg|kilo(?:gram)?s?|mg|ml|millilit(?:er|re)s?|cl|dl|l|lit(?:er|re)s?|oz|ounces?|fl\.? ?oz|lbs?|pounds?|cups?|c|tbsps?|tbs|tablespoons?|tsps?|teaspoons?|pinch(?:es)?|dash(?:es)?|cloves?|eggs?|yolks?|whites?|sticks?|knobs?|sachets?|packets?|packs?|cans?|tins?|slices?|handfuls?|sprigs?|bunch(?:es)?)\b/i;

export function scaleText(text, factor, { unitsOnly = false } = {}) {
  if (!text || !factor || factor === 1) return text;
  return text.replace(QTY_RE, (match, a, range, b, offset, whole) => {
    const before = whole.slice(0, offset);
    const after = whole.slice(offset + match.length);
    if (/[\d.,/]$/.test(before) || /^\s*[°%]/.test(after)) return match;           // part of a bigger number, temperature, percent
    if (/^\s*[x×]\s*\d/i.test(after) || /\d\s*[x×]\s*$/i.test(before)) return match; // dimensions like 23 x 13 cm
    const unitMatch = after.match(UNIT_AFTER);
    const leading = !unitsOnly && /^[\s\-•*+(]*$/.test(before);
    if (!leading && !unitMatch) return match;
    const unit = unitMatch ? unitMatch[1] : '';
    const scaledA = formatQty(parseQty(a) * factor, unit);
    if (!range) return scaledA;
    const sep = range.slice(0, range.lastIndexOf(b));
    return `${scaledA}${sep}${formatQty(parseQty(b) * factor, unit)}`;
  });
}

const EMOJI = [
  [/pizza/i, '🍕'], [/croissant|danish|pastry|pastries/i, '🥐'], [/bagel/i, '🥯'], [/pretzel/i, '🥨'],
  [/baguette/i, '🥖'], [/bread|loaf|focaccia|sourdough|brioche|\bbuns?\b|\brolls?\b|ciabatta|naan|pita|challah/i, '🍞'],
  [/cupcake|muffin/i, '🧁'], [/cake|cheesecake/i, '🍰'], [/cookie|biscuit/i, '🍪'], [/\bpie\b|\btart\b/i, '🥧'],
  [/pancake|crepe|crêpe|waffle/i, '🥞'], [/brownie|chocolate|fudge/i, '🍫'], [/ice cream|gelato/i, '🍨'],
  [/soup|stew|chowder|broth/i, '🍲'], [/curry|dal|daal/i, '🍛'], [/pasta|spaghetti|noodle|lasagn|macaroni|ramen/i, '🍝'],
  [/rice|risotto|paella|biryani|pilaf/i, '🍚'], [/taco|burrito|quesadilla|enchilada/i, '🌮'], [/burger/i, '🍔'],
  [/sandwich|toastie/i, '🥪'], [/salad/i, '🥗'], [/chicken|turkey/i, '🍗'], [/beef|steak|lamb|pork|meatball/i, '🥩'],
  [/fish|salmon|tuna|cod|shrimp|prawn|seafood/i, '🐟'], [/egg|omelet|frittata|shakshuka/i, '🍳'],
  [/smoothie|juice|shake|lemonade/i, '🥤'], [/coffee|latte/i, '☕'], [/dumpling|gyoza/i, '🥟'],
];

export function guessEmoji(recipe) {
  const title = recipe.title || '';
  for (const [re, emoji] of EMOJI) if (re.test(title)) return emoji;
  const everything = recipe.ingredients.flatMap(g => g.items).join(' ');
  if (/yeast/i.test(everything) && /flour/i.test(everything)) return '🍞';
  return '🍳';
}

// Which ingredient lines a step seems to use (matched on each ingredient's main word).
const STOP = new Set('plus extra about optional to taste of the a an for fresh freshly large small medium warm cold hot lukewarm room temperature fine finely coarse coarsely chopped minced diced sliced grated softened melted ground dried whole all purpose instant active dry heaped level packed rounded divided more needed'.split(' '));
const UNIT_WORDS = new RegExp(`\\b${UNIT_AFTER.source.replace(/^\^\\s\*\(/, '(')}`, 'gi');

export function ingredientsUsedIn(recipe, step) {
  const haystack = ` ${plainText(`${step.title} ${step.text}`).toLowerCase()} `;
  const used = [];
  for (const group of recipe.ingredients) {
    for (const item of group.items) {
      if (keyWords(item).some(w => new RegExp(`\\b${escapeRe(w)}(e?s)?\\b`).test(haystack))) used.push(item);
    }
  }
  return used.slice(0, 8);
}

function keyWords(item) {
  const core = plainText(item).toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .split(/,|\s[-–]\s/)[0]
    .replace(new RegExp(QTY, 'g'), ' ')
    .replace(UNIT_WORDS, ' ');
  const words = [];
  for (const option of core.split(/\bor\b|\band\b|\//)) {
    const w = (option.match(/[a-zà-ÿ]+(?:-[a-zà-ÿ]+)*/g) || []).filter(x => x.length > 2 && !STOP.has(x));
    if (w.length) words.push(w[w.length - 1].replace(/(e?s)$/, '') || w[w.length - 1]);
  }
  return words.filter(w => w.length > 2);
}

// ---------- JSON format ----------

function extractJson(text) {
  const candidates = [];
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidates.push(fence[1]);
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));
  for (const c of candidates) {
    for (const attempt of [c, repairJson(c)]) {
      try {
        let obj = JSON.parse(attempt);
        if (obj && obj.recipe && typeof obj.recipe === 'object' && !Array.isArray(obj.recipe)) obj = obj.recipe;
        if (obj && typeof obj === 'object' && (obj.steps || obj.ingredients || obj.instructions || obj.method)) return obj;
      } catch { /* try the next candidate */ }
    }
  }
  return null;
}

function repairJson(s) {
  return s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/,\s*([}\]])/g, '$1');
}

const str = v => (v == null ? '' : Array.isArray(v) ? v.map(str).join('\n') : String(v)).trim();
const toList = v => (v == null || v === '' ? [] : Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : [v]);

function itemText(v) {
  if (v == null) return '';
  if (typeof v !== 'object') return stripMarker(String(v).trim());
  const amount = str(v.quantity ?? v.qty ?? v.amount);
  const unit = str(v.unit);
  const name = str(v.name ?? v.item ?? v.ingredient ?? v.text ?? v.title);
  const note = str(v.note ?? v.notes ?? v.preparation ?? v.prep);
  return [[amount, unit, name].filter(Boolean).join(' '), note].filter(Boolean).join(', ');
}

function fromJson(o) {
  return {
    title: cleanInline(str(o.title ?? o.name)) || 'Untitled recipe',
    description: str(o.description ?? o.summary ?? o.intro),
    servings: parseServings(o.servings ?? o.yield ?? o.serves ?? o.makes),
    times: jsonTimes(o),
    equipment: toList(o.equipment ?? o.tools).map(itemText).filter(Boolean),
    ingredients: jsonIngredients(o.ingredients),
    steps: jsonSteps(o.steps ?? o.instructions ?? o.method ?? o.directions),
    notes: toList(o.notes ?? o.tips).map(itemText).filter(Boolean),
  };
}

const TIME_KEYS = [
  ['Prep', ['prepTime', 'prep_time', 'prep', 'activeTime']],
  ['Rise', ['riseTime', 'rise_time', 'proofTime', 'proofingTime', 'rise']],
  ['Cook', ['cookTime', 'cook_time', 'cookingTime', 'cook']],
  ['Bake', ['bakeTime', 'bake_time', 'bakingTime', 'bake']],
  ['Total', ['totalTime', 'total_time', 'total']],
];

function jsonTimes(o) {
  const src = { ...o, ...(o.times && typeof o.times === 'object' ? o.times : {}) };
  const out = [];
  for (const [label, keys] of TIME_KEYS) {
    const key = keys.find(k => src[k]);
    if (key) out.push({ label, value: typeof src[key] === 'number' ? formatDuration(src[key]) : str(src[key]) });
  }
  return out;
}

function jsonIngredients(v) {
  if (!v) return [];
  if (!Array.isArray(v) && typeof v === 'object') {
    return Object.entries(v)
      .map(([name, items]) => ({ name: cleanInline(name), items: toList(items).map(itemText).filter(Boolean) }))
      .filter(g => g.items.length);
  }
  const groups = [];
  let loose = null;
  for (const entry of toList(v)) {
    const items = entry && typeof entry === 'object' && (entry.items ?? entry.ingredients ?? entry.list);
    if (Array.isArray(items)) {
      groups.push({ name: cleanInline(str(entry.group ?? entry.section ?? entry.name ?? entry.title)), items: items.map(itemText).filter(Boolean) });
      loose = null;
    } else {
      const t = itemText(entry);
      if (!t) continue;
      if (!loose) groups.push(loose = { name: '', items: [] });
      loose.items.push(t);
    }
  }
  return groups.filter(g => g.items.length);
}

function jsonSteps(v, phase = '') {
  const out = [];
  for (const entry of toList(v)) {
    if (entry == null || entry === '') continue;
    if (typeof entry !== 'object') {
      const t = stripMarker(String(entry).trim());
      if (t) out.push(makeStep({ ...splitLead(t), phase }));
      continue;
    }
    const nested = entry.steps ?? entry.instructions;
    if (Array.isArray(nested)) {
      out.push(...jsonSteps(nested, cleanInline(str(entry.title ?? entry.name ?? entry.phase ?? entry.section ?? entry.group)) || phase));
      continue;
    }
    let title = cleanInline(str(entry.title ?? entry.name ?? entry.heading ?? entry.summary));
    let text = str(entry.text ?? entry.instruction ?? entry.instructions ?? entry.description ?? entry.details ?? entry.body ?? entry.content ?? (typeof entry.step === 'string' ? entry.step : ''));
    if (!title) ({ title, text } = splitLead(text));
    out.push(makeStep({
      title,
      text,
      tip: str(entry.tip ?? entry.tips ?? entry.note ?? entry.notes),
      timers: jsonTimers(entry.timers ?? entry.timer ?? entry.timerMinutes ?? entry.timer_minutes ?? entry.minutes ?? entry.duration),
      phase: cleanInline(str(entry.phase ?? entry.section ?? entry.group ?? entry.stage)) || phase,
    }));
  }
  return out;
}

function jsonTimers(v) {
  const out = [];
  for (const t of toList(v)) {
    if (t == null || t === '') continue;
    if (typeof t === 'number') out.push({ minutes: t, label: '' });
    else if (typeof t === 'string') {
      const n = Number(t);
      if (n > 0) out.push({ minutes: n, label: '' });
      else out.push(...findTimers(t));
    } else {
      const minutes = Number(t.minutes ?? t.mins ?? (t.seconds != null ? t.seconds / 60 : null) ?? (t.hours != null ? t.hours * 60 : null) ?? t.duration ?? t.time);
      if (minutes > 0) out.push({ minutes, label: cleanInline(str(t.label ?? t.name ?? t.title)) });
      else if (typeof (t.duration ?? t.time) === 'string') out.push(...findTimers(t.duration ?? t.time));
    }
  }
  return out.filter(t => t.minutes > 0).slice(0, 4);
}

// ---------- Free-form text ----------

function fromText(text) {
  const lines = text.split('\n');
  const recipe = { title: 'Untitled recipe', description: '', servings: null, times: [], equipment: [], ingredients: [], steps: [], notes: [] };
  const titleIndex = findTitleLine(lines);
  if (titleIndex >= 0) recipe.title = cleanInline(headingText(lines[titleIndex]) ?? lines[titleIndex]).replace(/:$/, '');

  let section = 'intro';
  let group = null;
  let step = null;
  const rawSteps = [];
  const intro = [];

  for (let n = titleIndex + 1; n < lines.length; n++) {
    const line = lines[n];
    if (!line.trim() || /^\s*([-*_])\1{2,}\s*$/.test(line) || /^\s*```/.test(line)) continue;

    const heading = headingText(line);
    if (heading != null) {
      const kind = classifyHeading(heading);
      if (STEP_HEADING.test(heading) || (section === 'steps' && !kind)) {
        section = 'steps';
        step = { title: cleanInline(heading.replace(STEP_PREFIX, '')), lines: [], fromHeading: true };
        rawSteps.push(step);
      } else if (kind) {
        section = kind;
        group = null;
        step = null;
        const named = kind === 'ingredients' && plainText(heading).match(/ingredients?\s*(?:[-–:(]|\bfor\b)\s*(.+?)\)?$/i);
        if (named) recipe.ingredients.push(group = { name: cleanInline(named[1]), items: [] });
      } else if (section === 'ingredients') {
        recipe.ingredients.push(group = { name: cleanInline(heading), items: [] });
      } else if (section === 'notes') {
        recipe.notes.push(`**${cleanInline(heading)}**`);
      }
      continue;
    }

    const item = listItem(line);
    const content = item ? item.text : line.trim();
    if (!item && CHATTER.test(plainText(content))) continue;

    switch (section) {
      case 'intro':
        if (!applyMeta(recipe, content)) intro.push(content);
        break;
      case 'ingredients':
        if (!group) recipe.ingredients.push(group = { name: '', items: [] });
        group.items.push(content);
        break;
      case 'equipment':
        recipe.equipment.push(content);
        break;
      case 'notes':
        recipe.notes.push(content);
        break;
      case 'steps': {
        const continues = step && (step.fromHeading || !item || item.indent >= 2);
        if (continues) step.lines.push({ kind: item ? item.kind : 'para', text: content });
        else {
          const { title, text: body } = splitLead(content);
          step = { title, lines: body ? [{ kind: 'para', text: body }] : [], fromHeading: false };
          rawSteps.push(step);
        }
        break;
      }
    }
  }

  recipe.description = intro.join('\n');
  recipe.ingredients = recipe.ingredients.filter(g => g.items.length);
  recipe.steps = expandSteps(rawSteps);
  if (!recipe.steps.length && !recipe.ingredients.length) fallbackScan(lines.slice(titleIndex + 1), recipe);
  return recipe;
}

// A heading step with several numbered lines under it is a phase ("Making the dough")
// holding several real steps.
function expandSteps(rawSteps) {
  const out = [];
  for (const s of rawSteps) {
    const numbered = s.lines.filter(l => l.kind === 'num').length;
    if (s.fromHeading && numbered >= 2) {
      const lead = [];
      let current = null;
      for (const l of s.lines) {
        if (l.kind === 'num') {
          current = { ...splitLead(l.text), phase: s.title, extra: lead.splice(0) };
          out.push(current);
        } else if (current) current.extra.push(l);
        else lead.push(l);
      }
      for (const c of out) if (c.extra) { c.text = [c.text, joinLines(c.extra)].filter(Boolean).join('\n'); delete c.extra; }
    } else {
      out.push({ title: s.title, text: joinLines(s.lines), phase: '' });
    }
  }
  return out.filter(s => s.title || s.text).map(makeStep);
}

function fallbackScan(lines, recipe) {
  for (const line of lines) {
    const item = listItem(line);
    if (!item) continue;
    if (item.kind === 'num') recipe.steps.push(makeStep(splitLead(item.text)));
    else {
      if (!recipe.ingredients.length) recipe.ingredients.push({ name: '', items: [] });
      recipe.ingredients[0].items.push(item.text);
    }
  }
  if (!recipe.steps.length) {
    const paragraphs = lines.map(l => l.trim()).filter(l => l && !CHATTER.test(plainText(l)) && headingText(l) == null && !listItem(l));
    recipe.steps = paragraphs.map(p => makeStep(splitLead(p)));
    recipe.description = '';
  }
}

function findTitleLine(lines) {
  let firstText = -1;
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const h = headingText(line);
    if (h != null) {
      if (classifyHeading(h) || STEP_HEADING.test(h)) break;
      return i;
    }
    if (firstText < 0 && !CHATTER.test(plainText(line)) && !listItem(line) && !META.test(plainText(line))) firstText = i;
  }
  return firstText >= 0 && lines[firstText].trim().length <= 70 ? firstText : -1;
}

function headingText(line) {
  const t = line.trim();
  let m = t.match(/^#{1,6}\s+(.+?)\s*#*$/);
  if (m) return stripColon(m[1]);
  m = t.match(/^(?:\*\*|__)([^*_].*?)(?:\*\*|__):?$/);
  if (m && m[1].length <= 80) return stripColon(m[1]);
  m = t.match(/^([A-Za-z][^.!?:]{0,48}):$/);
  if (m) return m[1];
  return null;
}

function classifyHeading(h) {
  const t = plainText(h).toLowerCase();
  if (t.length > 60) return null;
  if (/ingredient|you'?ll need|you will need|what you need|shopping list/.test(t)) return 'ingredients';
  if (/equipment|\btools\b|utensils/.test(t)) return 'equipment';
  if (/instruction|method|direction|^steps?\b|how to make|procedure|^preparation$|let'?s (make|bake|cook)/.test(t)) return 'steps';
  if (/\bnotes?\b|\btips?\b|variation|storage|storing|substitut|troubleshoot|\bfaq\b|serving suggestion|make ahead/.test(t)) return 'notes';
  if (/nutrition/.test(t)) return 'skip';
  return null;
}

function listItem(line) {
  const indentOf = s => s.replace(/\t/g, '    ').length;
  let m = line.match(/^(\s*)\*\*(\d+)[.)]\s*(.+?)\*\*\s*(.*)$/);
  if (m) return { kind: 'num', indent: indentOf(m[1]), text: `**${stripColon(m[3])}:** ${m[4]}`.trim() };
  m = line.match(/^(\s*)(?:\*\*)?step\s*\d+\s*[:.\-–—]\s*(?:\*\*)?\s*(.+)$/i);
  if (m) return { kind: 'num', indent: indentOf(m[1]), text: m[2].trim() };
  m = line.match(/^(\s*)\d+[.)]\s+(.*)$/);
  if (m) return { kind: 'num', indent: indentOf(m[1]), text: stripCheckbox(m[2].trim()) };
  m = line.match(/^(\s*)[-*•+▪◦]\s+(.*)$/);
  if (m) return { kind: 'bullet', indent: indentOf(m[1]), text: stripCheckbox(m[2].trim()) };
  return null;
}

function applyMeta(recipe, content) {
  const m = plainText(content).match(META);
  if (!m) return false;
  const key = m[1].toLowerCase();
  const value = m[2].trim();
  if (/serv|yield|makes/.test(key)) recipe.servings = parseServings(value);
  else recipe.times.push({ label: timeLabel(key), value });
  return true;
}

function timeLabel(k) {
  if (k.startsWith('prep') || /active|hands/.test(k)) return 'Prep';
  if (/ris|proof/.test(k)) return 'Rise';
  if (k.startsWith('rest')) return 'Rest';
  if (k.startsWith('bak')) return 'Bake';
  if (k.startsWith('cook')) return 'Cook';
  return 'Total';
}

// ---------- Small helpers ----------

function makeStep({ title = '', text = '', tip = '', timers = [], phase = '' }) {
  return { title: cleanInline(title), text: String(text || '').trim(), tip: String(tip || '').trim(), timers, phase: cleanInline(phase) };
}

function splitLead(text) {
  const t = String(text || '').trim();
  let m = t.match(/^\*\*(.+?)\*\*\s*([:.\-–—])?\s*([\s\S]*)$/);
  if (m && m[1].length <= 60 && (m[2] || /[:.]$/.test(m[1]) || !m[3] || /^[A-Z]/.test(m[3]))) {
    return { title: cleanInline(m[1]).replace(/[:.]$/, ''), text: m[3].trim() };
  }
  m = t.match(/^([A-Z][^:.!?]{1,40}):\s+([\s\S]+)$/);
  if (m && m[1].trim().split(/\s+/).length <= 5) return { title: m[1].trim(), text: m[2].trim() };
  return { title: '', text: t };
}

function joinLines(lines) {
  return lines.map(l => (l.kind === 'para' ? l.text : `• ${l.text}`)).join('\n');
}

function parseServings(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return { count: v, label: `${v} servings` };
  let label = cleanInline(String(v));
  if (/^\d+(?:[.,]\d+)?$/.test(label)) label = `${label} servings`;
  const m = label.match(/\d+(?:[.,]\d+)?/);
  return { count: m ? num(m[0]) : null, label };
}

function parseQty(s) {
  s = String(s).trim().replace(',', '.');
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) + m[2] / m[3];
  m = s.match(/^(\d+)\/(\d+)$/);
  if (m) return m[1] / m[2];
  m = s.match(/^(\d*)([½⅓⅔¼¾⅛⅜⅝⅞])$/);
  if (m) return (Number(m[1]) || 0) + FRACTION_CHARS[m[2]];
  return parseFloat(s);
}

function formatQty(n, unit) {
  const trim = d => String(+n.toFixed(d));
  if (/^(g|grams?|mg|ml|millilit(er|re)s?)$/i.test(unit)) return n >= 10 ? String(Math.round(n)) : trim(1);
  if (/^(kg|kilo(gram)?s?|l|lit(er|re)s?|cl|dl)$/i.test(unit)) return trim(2);
  const whole = Math.floor(n);
  const frac = n - whole;
  const nice = [[0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾'], [1, '']];
  for (const [v, glyph] of nice) {
    if (Math.abs(frac - v) < 0.04) {
      const w = v === 1 ? whole + 1 : whole;
      return glyph ? `${w || ''}${glyph}` : String(w);
    }
  }
  return trim(1);
}

const num = s => parseFloat(String(s).replace(',', '.'));
const stripColon = s => s.replace(/\s*:\s*$/, '').trim();
const stripMarker = s => s.replace(/^\s*(?:[-*•+]|\d+[.)])\s+/, '');
const stripCheckbox = s => s.replace(/^\[[ xX]\]\s*/, '');
const cleanInline = s => String(s ?? '').replace(/\*\*|__|`/g, '').replace(/^#+\s*/, '').replace(/^\*(.*)\*$/, '$1').trim();
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
