# Mise: step-by-step cooking

Paste a recipe (from Gemini or anywhere) and cook it one big, clear step at a time, with built-in timers.

## How to use it

1. In the app, tap **Add recipe** → **Copy prompt for Gemini**.
2. Paste that prompt into your Gemini chat (right after it gives you a recipe).
3. Copy Gemini's answer, go back to the app and tap **Paste**. Check the preview, then **Save**.
4. Tap **Start cooking**. Swipe or tap **Next step**; tap a timer button to start a timer.

Any ordinary recipe text (bullet lists, numbered steps) also works without the special prompt.

## Features

- Cook mode: one step at a time (or all steps in a list), large text, swipe between steps, screen stays on
- Timers found automatically in the steps ("rise for 1–2 hours" → ⏱ 1 h); several can run at once, with alarm + vibration
- Ingredient checklist, and "You'll need" chips showing what each step uses
- Scale the recipe up or down (quantities update everywhere)
- Look & settings: 8 colour themes, light/dark, 4 fonts, text size, card style, cook-mode layout, editable Gemini prompt
- Works offline and installs to your home screen (PWA); recipes are saved on the device; export/import backups

## Run it on your computer

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Files

- `index.html`, `styles.css`: page shell and all styling (colour tokens at the top of the CSS)
- `js/app.js`: screens, themes, actions
- `js/parser.js`: reads pasted recipes (JSON from the Gemini prompt or free text), finds timers, scales quantities
- `js/content.js`: the Gemini prompt and the sample recipe
- `js/store.js`, `js/timers.js`: saving data and kitchen timers
- `sw.js`, `manifest.webmanifest`, `icons/`: offline support and home-screen install
