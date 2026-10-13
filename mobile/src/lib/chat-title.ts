// Short, tidy chat names from the first message, like AI apps do ("Buttermilk substitute",
// "Cooking with eggs, flour and milk"). Runs on the phone for now; once Sous is connected the
// AI can suggest the name instead, and this stays as the instant first guess.

const MAX_WORDS = 6;
const MAX_CHARS = 42;
const COOK_VERB = /^(bake|make|cook|roast|grill|fry|boil|steam|prep|prepare|find|store|freeze|reheat|marinate|season|cut|chop|slice|knead|whip|plan|host|feed|use|fix|clean|sharpen)\b/i;

// Common openers that add nothing to a title.
const FILLER = [
  /^(hi|hey|hello|yo|ok(ay)?|so|um+|sous)[,!.\s]+/i,
  /^(please|pls)\s+/i,
  /^(can|could|would|will) you( please)?( help me( to)?)?\s+/i,
  /^help me( to)?\s+/i,
  /^i('d| would) like( to)?\s+/i,
  /^i (want|need|wanna|have) to\s+/i,
  /^i('m| am) (trying|looking|planning) to\s+/i,
  /^(tell|show|give) me\s+/i,
  /^(do you know|any idea)\s+/i,
  /^(what('s| is| are)|how('s| is)) (a |an |the )?(good |best |easy |quick )?(way|recipe|idea)s? (to|for)\s+/i,
];

const RULES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/(?:instead of|substitute(?: for)?|replacement for|swap(?: out)?|replace)\s+(?:the\s+|my\s+)?([^?.!,]+)/i, m => `${m[1]} substitute`],
  [/what (?:can|should|could) i (?:cook|make|bake)(?: for (\w+))? with\s+([^?.!]+)/i, m => `Cooking with ${m[2]}`],
  [/what (?:can|should|could) i (?:cook|make|bake) (?:for|tonight|today)\s*([^?.!]*)/i, m => `Ideas for ${m[1] || 'tonight'}`],
  [/is it (?:safe|ok|okay|bad|healthy) to (?:eat|drink|use|freeze|reheat)\s+([^?.!]+)/i, m => `${m[1]} safety`],
  [/how (?:long|many minutes)(?: should i| do i| to| does it take to| do you)?\s+(cook|bake|boil|roast|fry|grill|steam|simmer|rest|marinate)\s+([^?.!]+)/i, m => gerund(`${m[1]} ${m[2]}`)],
  [/how (?:long|many minutes)(?: should i| do i| to| does it take to| do you)?\s+(?:cook\s+)?([^?.!]+)/i, m => `Cooking time for ${m[1]}`],
  [/(?:my|the)\s+([^?.!]+?)\s+(?:is|are|was|were|keeps?|turned|came out)\s+(?:too\s+|really\s+|very\s+|so\s+)?(\w+)/i, m => `${cap(m[2])} ${m[1]} fix`],
  [/^plan\s+([^?.!]+)/i, m => `Plan: ${m[1]}`],
  [/^how (?:do|can|should) i\s+([^?.!]+)/i, m => gerund(m[1])],
];

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// "make pancakes" -> "Making pancakes"
function gerund(phrase: string) {
  const [verb, ...rest] = phrase.trim().split(/\s+/);
  const v = verb.toLowerCase();
  const ing = v.endsWith('ie') ? `${v.slice(0, -2)}ying`
    : v.endsWith('e') && !v.endsWith('ee') ? `${v.slice(0, -1)}ing`
    : /^[^aeiou]*[aeiou][bdgmnpt]$/.test(v) ? `${v}${v.slice(-1)}ing`
    : `${v}ing`;
  return [ing, ...rest].join(' ');
}

// Words a cut-off title shouldn't end on ("…cake for my").
const DANGLING = /^(and|or|but|with|for|of|the|a|an|to|in|on|at|from|by|my|your|his|her|their|our|this|that|these|some|so|very|too)$/i;

function trimWords(s: string) {
  const words = s.split(/\s+/).filter(Boolean);
  const kept: string[] = [];
  for (const w of words.slice(0, MAX_WORDS)) {
    if ([...kept, w].join(' ').length > MAX_CHARS) break;
    kept.push(w);
  }
  if (kept.length < words.length) while (kept.length > 2 && DANGLING.test(kept[kept.length - 1])) kept.pop();
  return kept.join(' ').replace(/[\s,;:–-]+$/, '');
}

export function smartTitle(text: string): string {
  let t = text.replace(/\s+/g, ' ').replace(/[*_`#>]/g, '').trim();
  if (!t) return 'New chat';
  for (let i = 0; i < 3; i++) for (const f of FILLER) t = t.replace(f, '');

  for (const [re, make] of RULES) {
    const m = t.match(re);
    if (m) {
      const title = trimWords(make(m).replace(/\s+/g, ' ').trim());
      if (title.length >= 3) return cap(title);
    }
  }

  // Starts with a cooking verb: "bake a cake" -> "Baking a cake".
  if (COOK_VERB.test(t)) return cap(trimWords(gerund(t.split(/(?<=[.!?])\s/)[0].replace(/[?.!]+$/, ''))));

  // Fallback: the first sentence, without "my" and the question mark, cut at a word boundary.
  const first = (t.split(/(?<=[.!?])\s/)[0] || t).replace(/[?.!]+$/, '').replace(/^(my|the|a|an)\s+/i, '');
  return cap(trimWords(first)) || 'New chat';
}
