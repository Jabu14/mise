// Everything is saved on this device (localStorage): your recipes and your look & feel settings.
import { cleanRecipe, cleanRecipes, cleanSettings, newId as makeId } from './validate.js';

const RECIPES_KEY = 'mise.recipes.v1';
const SETTINGS_KEY = 'mise.settings.v1';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Could not save', key, err);
  }
}

export const DEFAULT_SETTINGS = {
  theme: 'sourdough',
  mode: 'auto',         // auto | light | dark
  font: 'classic',      // classic | modern | rounded | cookbook
  textSize: 'm',        // s | m | l | xl
  cards: 'soft',        // soft | flat
  cookLayout: 'cards',  // cards (one step at a time) | list
  stepIngredients: true,
  highlightTimes: true,
  keepAwake: true,
  timerSound: true,
  vibrate: true,
  recipePrompt: '',     // empty = the built-in prompt
};

export const settings = cleanSettings(read(SETTINGS_KEY, {}), DEFAULT_SETTINGS);

export function updateSettings(patch) {
  Object.assign(settings, cleanSettings({ ...settings, ...patch }, DEFAULT_SETTINGS));
  write(SETTINGS_KEY, settings);
}

export function resetLook() {
  Object.assign(settings, DEFAULT_SETTINGS, { recipePrompt: settings.recipePrompt });
  write(SETTINGS_KEY, settings);
}

let recipes = cleanRecipes(read(RECIPES_KEY, []));
const persist = () => write(RECIPES_KEY, recipes);
const newId = makeId;

export function listRecipes() {
  return [...recipes].sort((a, b) => (b.lastOpened || b.updatedAt) - (a.lastOpened || a.updatedAt));
}

export function getRecipe(id) {
  const r = recipes.find(x => x.id === id) || null;
  if (r && !r.progress) r.progress = { step: 0, checked: [], scale: 1 };
  return r;
}

export function saveRecipe(recipe) {
  const now = Date.now();
  let stored = recipe.id ? getRecipe(recipe.id) : null;
  if (stored) Object.assign(stored, recipe, { updatedAt: now });
  else {
    stored = { ...recipe, id: recipe.id || newId(), createdAt: now, updatedAt: now };
    recipes.push(stored);
  }
  persist();
  return stored;
}

export function patchRecipe(id, patch) {
  const r = getRecipe(id);
  if (r) {
    Object.assign(r, patch);
    persist();
  }
  return r;
}

export function deleteRecipe(id) {
  recipes = recipes.filter(r => r.id !== id);
  persist();
}

export function exportRecipes() {
  return recipes;
}

export function importRecipes(list) {
  let added = 0;
  for (const raw of Array.isArray(list) ? list.slice(0, 2000) : []) {
    const r = cleanRecipe(raw);
    if (!r || getRecipe(r.id)) continue;
    recipes.push(r);
    added++;
  }
  persist();
  return added;
}
