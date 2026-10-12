// Types for the shared recipe reader (parser.js is copied from the web app).
import type { Group, Parsed, Step, Timer } from '../lib/store';

export function parseRecipe(raw: string): (Parsed & { warnings: string[] }) | null;
export function plainText(s: string): string;
export function formatDuration(min: number): string;
export function findTimers(text: string): Timer[];
export function scaleText(text: string, factor: number, options?: { unitsOnly?: boolean }): string;
export function guessEmoji(recipe: { title: string; ingredients: Group[] }): string;
export function ingredientsUsedIn(recipe: { ingredients: Group[] }, step: Step): string[];
