// AUTO-COPIED from web/js/content.js by scripts/sync-shared.js. Edit the web file, then run: npm run sync-shared
// The prompt you give your AI assistant, and a sample recipe to try the app with.

export const RECIPE_PROMPT = `Please rewrite the recipe from our conversation for my cooking app.

Reply with ONLY one JSON code block (nothing before or after it) using exactly this structure:

{
  "title": "Recipe name",
  "description": "One or two sentences about the dish",
  "servings": "1 loaf (about 12 slices)",
  "prepTime": "20 min",
  "cookTime": "40 min",
  "totalTime": "3 h 30 min",
  "equipment": ["Large bowl", "Dutch oven"],
  "ingredients": [
    { "group": "Dough", "items": ["500 g (4 cups) bread flour", "10 g (1¾ tsp) salt"] }
  ],
  "steps": [
    {
      "phase": "Mixing",
      "title": "Short action title",
      "text": "Clear instructions for just this step.",
      "timers": [{ "minutes": 60, "label": "First rise" }],
      "tip": "Optional helpful tip, or an empty string"
    }
  ],
  "notes": ["Storage, substitutions or troubleshooting tips"]
}

Rules:
- Split the method into small steps with one main action each (usually 8–20 steps).
- Start every ingredient with its quantity and unit, e.g. "7 g (2¼ tsp) instant yeast".
- Whenever a step involves waiting, resting, rising, baking or cooking, add a timer in minutes. For a range like 30–35 minutes use the shorter time and put the range in the label.
- Give oven temperatures in °C and °F.
- Use "phase" to group steps into stages (e.g. "Mixing", "First rise", "Shaping", "Baking").
- Group ingredients only if the recipe has parts (e.g. "Starter", "Dough", "Topping"); otherwise use one group with "group": "".`;

export const SAMPLE_RECIPE = `Okay, here's a simple crusty bread you can make at home! 🍞

## Easy Crusty Bread

A golden, crackly loaf with a soft, airy inside. Very little kneading — time does most of the work.

**Yield:** 1 loaf
**Prep time:** 20 minutes
**Rise time:** 2–3 hours
**Bake time:** 40 minutes

### Ingredients

* 500 g (4 cups) bread flour, plus extra for dusting
* 375 ml (1½ cups) warm water
* 7 g (2¼ tsp) instant yeast
* 10 g (1¾ tsp) fine salt
* 1 tsp sugar or honey
* 1 tbsp olive oil

### Instructions

1. **Wake up the yeast:** Stir the yeast and sugar into the warm water. Leave it for 5–10 minutes until it looks foamy on top.
2. **Mix the dough:** In a large bowl, combine the flour and salt. Pour in the yeast mixture and olive oil, then stir with a wooden spoon until no dry flour is left. The dough will be sticky — that's normal.
3. **Rest:** Cover the bowl and let the dough rest for 20 minutes so the flour can soak up the water.
4. **Stretch and fold:** With wet hands, grab one side of the dough, stretch it up and fold it over the middle. Turn the bowl and repeat 4 times. Do a set every 30 minutes, 3 sets in total.
5. **First rise:** Cover and leave in a warm spot for 1–2 hours, until doubled in size and bubbly.
6. **Shape:** Tip the dough onto a floured surface. Gently fold the edges into the middle, flip it over and tuck it into a tight round ball.
7. **Second rise:** Place the dough seam-side down on a sheet of baking paper. Cover with a tea towel and let it rise for 45 minutes.
8. **Preheat:** While it rises, put a Dutch oven (with its lid) in the oven and preheat to 230°C (450°F) for 30 minutes.
9. **Score:** Dust the top with flour and cut a 1 cm deep slash across the top with a sharp knife.
10. **Bake covered:** Carefully lower the dough (on its paper) into the hot pot, put the lid on and bake for 30 minutes.
11. **Bake uncovered:** Remove the lid and bake for another 10–15 minutes until deep golden brown. It should sound hollow when you tap the bottom.
12. **Cool:** Let the bread cool on a wire rack for at least 1 hour before slicing — it's still cooking inside!

### Tips

* No Dutch oven? Bake on a hot tray and put a small pan of boiling water on the bottom shelf for steam.
* For a tangier flavour, let the dough do its first rise in the fridge overnight (8–12 hours).
* Store at room temperature in a paper bag for up to 2 days.

Enjoy your homemade bread! Let me know if you'd like a whole wheat version.`;
