// What Sous is told about you along with your question, built from your settings and (if you allow
// it) your saved recipes, meal plan and cooking journal. Shown word for word in Sous settings so
// nothing is hidden. Kept short so it doesn't crowd out the conversation.
import type { CookEntry } from './cook-log';
import { MEALS, dayKey, type PlanEntry } from './planner';
import type { Recipe, Settings } from './store';

const LEVEL: Record<string, string> = { beginner: 'a beginner', home: 'a home cook', confident: 'a confident cook' };
const UNITS: Record<string, string> = { metric: 'metric units', us: 'US units', both: 'metric with US in brackets' };

export function buildSousContext(input: {
  settings: Settings;
  recipes: Recipe[];
  plan: PlanEntry[];
  cooks: CookEntry[];
  now?: number;
}): string[] {
  const { settings: s, recipes, plan, cooks } = input;
  const now = input.now ?? Date.now();
  const title = (id?: string) => recipes.find(r => r.id === id)?.title;
  const lines: string[] = [];

  lines.push(`${s.name.trim() ? `Their name is ${s.name.trim()}. ` : ''}They are ${LEVEL[s.aiSkill] ?? 'a home cook'}, and want ${s.aiStyle === 'detailed' ? 'detailed' : 'short, simple'} answers in ${UNITS[s.aiUnits] ?? 'metric units'}.`);
  const diet = s.aiDiet.split(',').filter(Boolean);
  if (diet.length) lines.push(`Diet: ${diet.join(', ')}.`);
  if (s.aiNotes.trim()) lines.push(`Allergies and dislikes: ${s.aiNotes.trim()}`);

  if (s.aiUseRecipes && recipes.length) {
    const list = [...recipes].sort((a, b) => (b.lastOpened || b.updatedAt) - (a.lastOpened || a.updatedAt)).slice(0, 15).map(r => r.title);
    lines.push(`Saved recipes${recipes.length > 15 ? ' (most recent)' : ''}: ${list.join(', ')}.`);
  }

  if (s.aiUsePlan) {
    const today = dayKey(new Date(now));
    const soon = plan.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date) || MEALS.findIndex(([m]) => m === a.meal) - MEALS.findIndex(([m]) => m === b.meal)).slice(0, 12);
    if (soon.length) {
      const say = (e: PlanEntry) => {
        const d = new Date(`${e.date}T12:00:00`);
        const day = e.date === today ? 'today' : d.toLocaleDateString('en', { weekday: 'long' });
        return `${day} ${e.meal}: ${title(e.recipeId) ?? e.text ?? 'something'}`;
      };
      lines.push(`Meal plan: ${soon.map(say).join('; ')}.`);
    }
  }

  if (s.aiUseJournal && cooks.length) {
    const recent = cooks.slice(0, 6).map(c => {
      const ago = Math.round((now - c.at) / 864e5);
      const when = ago <= 0 ? 'today' : ago === 1 ? 'yesterday' : `${ago} days ago`;
      return `${c.title} (${when}${c.rating ? `, ${c.rating}/5` : ''}${c.note ? `, their note: "${c.note.slice(0, 120)}"` : ''})`;
    });
    lines.push(`Recently cooked: ${recent.join('; ')}.`);
  }

  return lines;
}
