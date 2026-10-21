# Mise: step-by-step cooking

Paste a recipe (from an AI assistant or anywhere) and cook it one big, clear step at a time, with built-in timers.

There are two versions with the same features and look:

| | `web/` | `mobile/` |
|---|---|---|
| What | Installable web app (PWA) | Native iPhone + Android app (React Native / Expo) |
| Use it | https://jabu14.github.io/mise/app/ → Share → Add to Home Screen | Expo Go app on your phone (see below) |
| Timer alarms | Only while the app is open | Ring even when the phone is locked |

## How to use it

1. Tap **Add recipe** → **Copy recipe prompt**.
2. Paste that prompt into your AI chat (right after it gives you a recipe).
3. Copy the answer, go back to the app and tap **Paste**. Check the preview, then **Save**.
4. Tap **Start cooking**. Swipe or tap **Next step**; tap a timer button to start a timer.

Any ordinary recipe text (bullet lists, numbered steps) also works without the special prompt.

## Run the native app on your iPhone (no Mac needed)

1. Install **Expo Go** from the App Store.
2. On the PC, in the `mobile` folder:
   ```bash
   npx expo start
   ```
3. Scan the QR code with the iPhone Camera app. Mise opens inside Expo Go.

The phone and PC must be on the same Wi-Fi. If the phone can't connect, run `npx expo start --tunnel` instead.

## Run the web app locally

```bash
python -m http.server 5173 --directory web
```

Changes pushed to `web/` are published to GitHub Pages automatically.

The site is organised as: `web/` (marketing landing at the root), `web/app/` (the installable web app), and `web/help/` (the Help center website).

## Files

- `web/index.html`, `web/marketing.css`: the marketing website; `web/help/`: the Help center website
- `web/app/`: the installable web app (`js/parser.js` reads recipes, `js/app.js` has the screens)
- `mobile/src/app/`: native screens (library, add/edit, recipe, cook mode, settings)
- `mobile/src/lib/`: saved data, timers + notifications, themes
- `mobile/src/shared/`: copied from `web/js/` by `npm run sync-shared` so both apps read recipes the same way
