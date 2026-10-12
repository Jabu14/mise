// The recipe shape the AI must return. It matches the JSON format of the app's recipe prompt,
// so the app reads AI results with the same parser (and the same safety checks) as pasted ones.
import { z } from 'zod';

// JSON Schema for Claude's structured output (every field required, no extras).
const str = { type: 'string' } as const;
const strList = { type: 'array', items: str } as const;

export const RECIPE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'description', 'servings', 'prepTime', 'cookTime', 'totalTime', 'equipment', 'ingredients', 'steps', 'notes'],
  properties: {
    title: str,
    description: str,
    servings: str,
    prepTime: str,
    cookTime: str,
    totalTime: str,
    equipment: strList,
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['group', 'items'],
        properties: { group: str, items: strList },
      },
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['phase', 'title', 'text', 'timers', 'tip'],
        properties: {
          phase: str,
          title: str,
          text: str,
          tip: str,
          timers: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['minutes', 'label'],
              properties: { minutes: { type: 'number' }, label: str },
            },
          },
        },
      },
    },
    notes: strList,
  },
} as const;

// Runtime check of what came back, with size caps (never trust model output blindly).
const text = (max: number) => z.string().max(max);

export const RecipeSchema = z.object({
  title: text(200),
  description: text(2000),
  servings: text(120),
  prepTime: text(60),
  cookTime: text(60),
  totalTime: text(60),
  equipment: z.array(text(200)).max(50),
  ingredients: z.array(z.object({ group: text(80), items: z.array(text(400)).max(300) })).max(30),
  steps: z
    .array(
      z.object({
        phase: text(80),
        title: text(200),
        text: text(4000),
        tip: text(2000),
        timers: z.array(z.object({ minutes: z.number().min(0).max(72 * 60), label: text(80) })).max(4),
      }),
    )
    .max(200),
  notes: z.array(text(2000)).max(100),
});

export type AiRecipe = z.infer<typeof RecipeSchema>;
