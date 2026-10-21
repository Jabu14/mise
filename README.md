# Mise: step-by-step cooking

Paste a recipe (from an AI assistant or anywhere) and cook it one big, clear step at a time, with built-in timers.

Mise is a native **iPhone + Android app** (React Native / Expo). The `web/` folder is Mise's **website**: a marketing landing page and the online Help center (not the app itself).

## How to use the app

1. Tap **Add recipe** → **Copy the Mise Prompt**.
2. Paste that prompt into your AI chat (right after it gives you a recipe).
3. Copy the answer, go back to the app and tap **Paste**. Check the preview, then **Save**.
4. Tap **Start cooking**. Swipe or tap **Next step**; tap a timer button to start a timer.

Any ordinary recipe text (bullet lists, numbered steps) also works without the special prompt.

## Run the app on your iPhone (no Mac needed)

1. Install **Expo Go** from the App Store.
2. On the PC, in the `mobile` folder:
   ```bash
   npx expo start
   ```
3. Scan the QR code with the iPhone Camera app. Mise opens inside Expo Go.

The phone and PC must be on the same Wi-Fi. If the phone can't connect, run `npx expo start --tunnel` instead.

## The website

- `web/index.html`, `web/marketing.css`: the marketing landing page (served at the GitHub Pages root).
- `web/help/`: the Help center website (searchable articles, Contact, Terms & Privacy).

Run it locally:

```bash
python -m http.server 5173 --directory web
```

Changes pushed to `web/` are published to GitHub Pages automatically.

## Files

- `web/`: the marketing + Help center website
- `mobile/src/app/`: native screens (library, add/edit, recipe, cook mode, settings)
- `mobile/src/lib/`: saved data, timers + notifications, themes, website links
- `mobile/src/shared/`: the recipe reader (`parser.js`) and the Mise Prompt (`content.js`)
