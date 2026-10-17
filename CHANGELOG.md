# Changelog

Versions follow the mobile app (`mobile/app.json`). The web app's offline cache name (`web/sw.js`) is bumped whenever the web files change.

## 1.21.0 (2026-10-17)

### Added
- **Navbar lens** (like iOS's newest tab bar): press and hold, or slide your finger along the navigation bar, and a glass lens lifts out a little bigger than the bar, follows your finger (the icon under it grows, with a light tick per tab), and opens that tab when you let go. Taps work as before.
- **QR scanner**: its own full-screen camera with a square viewfinder, corner brackets, a gliding scan line and a torch button. It only reads QR codes, says "That's not a Mise code" for anything else, and opens Mise codes straight away. The food scanner reads barcodes only again.
- **Choose what to share on its own page**: on the QR share page, "Choose recipe / cookbook / chat" opens a picker with search and filter chips (recipes: Recently added, Cooked, Not cooked yet and each collection; chats: Pinned, This week).
- **Settings pages**: Account → App now has its own row for Appearance, Cook mode, Units, Hands-free, Timers & alarms and Vibration, each opening a page for just that.
- **Developer tools hub**: Account layout (move Account sections up or down, or hide them; reset), Navigation bar (per-tab text with a live preview), Test data (sample recipe, 6 weeks of cooks for the streak, a test notification in 5 seconds, clear the journal, plan or list) and Storage (what's saved on the phone with sizes, peek inside, erase everything).

### Changed
- **Help center**: a "How can we help?" header with search, six topic cards with icons (Getting started, Cooking, Planning & shopping, Timers & alarms, Sous, App & sharing), questions grouped under each topic, and a "Still stuck?" card with Report an issue and Send feedback.
- **Page titles are centred** on every page.
- **Plan** is now the first section on Account, above Your kitchen.
- **Streak and cooked are separate**: the streak page shows only streak numbers (current, best, active weeks); what you cooked stays on the Cooked page.
- The QR share page no longer shows the "Ask them to scan it…" line.

## 1.20.0 (2026-10-17)

### Added
- **Sign-in gate.** Signed out, Mise shows only the sign-in screen (no tabs or navbar); signing in or creating an account opens the app, and signing out goes straight back to sign-in.
- **Mise's own pop-up sheets.** Menus and confirmations slide up from the bottom while the app behind shrinks back with rounded corners (like WhatsApp). Drag down or tap outside to close. Used for the account menu, sign out, delete account, profile photo, deleting recipes and chats, clearing lists and plans, and other confirmations.
- **Account sheet** (tap your name): who you're signed in as with a check, "Add another account", Edit profile and Sign out.
- **QR sharing** (the QR button on Account): share a recipe, a cookbook (collection), your shopping list, a Sous chat or your kitchen setup (colours, font, units, cook mode). The code holds everything, compressed, so no internet or account is needed. Scan it in Mise (the scanner now reads QR codes too) to preview and save. The code is a mise:// link, so other apps (like an authenticator) simply see it isn't for them.
- **Cooking streak page**: a big flame card, this week day by day, best streak, total cooks, this month, the last 12 weeks as bars, and a share button (text for now).
- **Kitchen history pages**: Recipes (when each was added, steps, times cooked), Cooked (every cook with date, time, stars and notes, plus average rating and most cooked) and Timers (recent timers with when you last used them), grouped by month.

### Changed
- **Your kitchen** is a normal list (Recipes, Cooked, Cooking streak, Timers) that opens those history pages instead of jumping to other tabs.
- **Status bubble** floats gently, pops when you change it, and the emoji picker is a sheet.
- **Navbar without text**: icons get bigger and the highlight grows to match.
- **Edit (pencil) button** uses Mise's heavier icon style, and Share became a QR button.

### Fixed
- Signing out no longer leaves you inside the app.

## 1.19.0 (2026-10-17)

### Added
- **Sign in and create an account.** A new sign-in sheet with Sign in / Create account (name, email, password with show/hide), "Forgot password?", and Apple / Google buttons marked "soon". It uses Supabase (free online database with built-in accounts) as soon as EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in mobile/.env.local (see mobile/.env.example); until then it runs in demo mode, where accounts are kept on the phone with salted, hashed passwords. The session is kept in the iPhone Keychain. Sign out from the Account tab; delete a demo account from Profile.
- **Developer tools** (Account → Developer, to be removed before launch): switch each tab's navbar text on or off (or all at once), plus build info.
- **Profile photo**: tap your picture in Profile to take or choose one.

### Changed
- **New Account header**: settings button on the left, Share and Edit on the right, a big profile picture with an emoji status bubble ("What's cooking?"), and your name with a menu (Edit profile, Sign out). Signed out, it shows "Sign in or create account".
- **Your kitchen**: Recipes, Cooked (with this month), Week streak and Timers are now tappable tiles instead of flat numbers.
- **Help & legal** replaces Support and now holds Help center, Report an issue, Send feedback, Terms & privacy and About Mise.
- **Appearance** no longer shows the sample step box at the top.

## 1.18.0 (2026-10-15)

### Changed
- **Meal plan is a normal calendar.** A month grid (Monday first) with dots under days that have meals planned (one per meal), today outlined and the chosen day filled in. Swipe the grid or use the arrows to change month; "Today" jumps back. Tap a day to see its Breakfast, Lunch and Dinner below, each with an Add button. "Add this week to my shopping list" uses the week of the chosen day, and ••• can clear the day or the week.
- **Floating, frosted navigation bar.** The bar now floats over the page with no strip of background behind it, and it's see-through glass: whatever scrolls underneath shows through, blurred. Pages leave room at the bottom so nothing hides behind it; in Sous the message box sits just above the bar and drops to the keyboard while typing.

## 1.17.0 (2026-10-15)

### Added
- **Ready by…** On a recipe, choose when you want to eat (±15 minutes, ±1 hour, tomorrow) and see a timeline of when to start each step, worked out from the step timers plus about 5 minutes for each hands-on step. "Every 30 minutes, 3 sets" counts all three sets, and "While it rises…" steps overlap the step before. "Remind me" sends a notification when it's time to start.
- **What can I make?** From the Recipes page: add what you have (or tap quick picks from your recipes' ingredients) and your saved recipes are sorted by how little you're missing, with the missing items listed. Salt, pepper, oil and water always count. "Ask Sous for ideas" opens Sous with your list. Your list is remembered.
- **Collections.** "Add to collection" on a recipe: pick Weeknight, Baking, Favourites, Quick, Healthy, For guests or type your own. Collections become filter chips (with counts) at the top of the Recipes page.

## 1.16.0 (2026-10-15)

### Added
- **Mise en place.** A new "Prep" button next to "Start cooking" opens a get-ready screen: preheat the oven (temperature found in the steps), get out the equipment, prep work found in the ingredients ("finely chopped" → Chop, "softened" → Soften…), and every ingredient to put on the counter, with a progress bar. Ticks are saved and shared with the recipe's ingredient list.
- **Units.** Show any recipe "As written", "Metric" (g, ml, °C, cm) or "US" (oz, lb, cups, °F, inches), from the switch above the ingredients or Settings → Cook mode. It converts ingredients, step text, cook mode and what hands-free reads aloud. When a recipe already gives both ("375 ml (1½ cups)", "230°C (450°F)", "7 g (2¼ tsp)") it keeps the one you use. Oven temperatures snap to the usual dial steps (220°C ↔ 425°F). Teaspoons and tablespoons stay as they are, and small gram amounts stay in grams.
- **Ingredient swaps.** A ⇄ button next to ingredients with known substitutes (buttermilk, eggs, butter, cream, yeast, baking powder, wine, garlic and about 30 more) shows what to use instead, with "Ask Sous about it".

## 1.15.0 (2026-10-15)

### Added
- **Meal plan reminders.** On each day you've planned something, a notification at 9 AM, noon or 4 PM lists what's on ("Dinner: Easy Crusty Bread"). They update by themselves when you change the plan. Tapping one opens the meal plan.
- **Finish what you started.** Leave cook mode halfway and you get a nudge four hours later ("You stopped at step 5 of 12"); going back to cook cancels it, and tapping it opens the recipe.
- Both live in Account → Notifications → Reminders (they used to say "soon") and follow your sound and preview choices.
- **Sous context.** New "Use my meal plan" and "Use my cooking journal" switches, and "What Sous knows about you" shows, word for word, what Sous will be told along with your messages once it's connected.

### Changed
- The shopping list's empty picture no longer sits in a box.

## 1.14.0 (2026-10-15)

### Added
- **Meal planner.** Plan breakfast, lunch and dinner for each day, a week at a time (Monday to Sunday, with Previous / Next week). Fill a slot with a saved recipe or a note ("Leftovers", "Eating out"…). "Add the week to my shopping list" adds every planned recipe's ingredients in one go, combined by the shopping list as usual. "Plan my week with Sous" opens Sous with the request ready. Open it from the new calendar button on the Recipes page; on a recipe, the calendar button adds it to any day in the next two weeks.
- **Cooking journal.** Finishing a recipe in cook mode logs it. The "All done!" screen asks how it went: star rating, a photo of your dish (kept in the app's own folder) and notes for next time. Your last notes and stars show on step 1 the next time you cook it, and a recipe's cooks are listed on its page. The journal (from "Journal" next to Completed) shows every cook with totals, this month and your weekly cooking streak. Completed recipes use your latest photo as their picture.

### Fixed
- **Tab highlight on far jumps**: tapping a tab several places away (Recipes → Account) now glides the highlight there too, instead of only between neighbouring tabs.

## 1.13.0 (2026-10-15)

### Added
- **Nutrition scanner.** Scan a food barcode (or type it) to see the product's Nutri-Score (A–E), NOVA group (how processed it is), fat / saturated fat / sugars / salt levels, nutrition per 100 g, allergens and ingredients, from the free Open Food Facts database. "Ask Sous about it" opens Sous with the question ready; "Add to shopping list" adds it. Recent scans are remembered. Open it from the barcode button on the shopping list, or ＋ › Scan food in Sous.

### Changed
- **Smoother tab swiping**: the page now finishes gliding before the app switches tabs, so there's no second little jump.
- **Sliding tab highlight**: a soft pill slides between the tabs and follows your finger while you swipe.
- **Add tab** is a normal tab like the others (no glow); the Recipes page's add button lost its glow too.
- **Sliding switches**: every "pick one" control (cooking level, text size, font, layout, Sous settings, Monthly / Annual) glides to your choice.
- Appearance preview no longer shows the "Shaping" label.

## 1.12.0 (2026-10-15)

### Added
- **Smart shopping list.** "Add to shopping list" on any recipe (scaled to the amount you're making). Matching ingredients are combined (two recipes' flour becomes one line), large amounts read nicely (1000 g → 1 kg), plain water is skipped, and items are grouped by aisle (Produce, Meat & fish, Dairy & eggs, Bakery & grains, Pantry, Frozen). Tap to tick off (it moves to "In your cart"), swipe to remove, type your own items, share the list. Open it from the new cart button (with a count) on the Recipes page.
- **Notification settings** in the style of WhatsApp: show timer notifications, play a sound, show preview (timer and recipe name), in-app alarm tone and vibration, an app icon badge with the number of running timers, and Reset. Reminders are marked "soon".

### Changed
- **Floating navigation bar**: a rounded, frosted bar that floats above the bottom edge.
- **Account → Sous section**: Sous settings, Voice, Usage and the Mise Prompt (the old "Recipe prompt", renamed).
- **Usage** looks like Claude's usage page: a big "% used" meter with when it resets, then simple rows for this month, Sous and cooking.
- **Voice** looks like ChatGPT's: swipe between voices, each with its own glowing orb; Speed and Language rows; when Mise speaks.

## 1.11.0 (2026-10-14)

### Changed
- **Subscription page redone in the style of Google One**: a Monthly / Annual switch, then a card per plan with its price, a "Get" button and what it includes ("Show all benefits" opens the rest). Three plans: **Mise Plus** (recommended, $4.99/mo or $39.99/yr), **Mise Pro** for families ($9.99/mo or $79.99/yr) and **Mise Chef** with nutrition and goal-based meal plans ($19.99/mo or $159.99/yr). Prices are placeholders. Restore purchases removed for now.
- **Account → Plan** is a single "Upgrade to Mise Plus" row.

## 1.10.0 (2026-10-14)

### Added
- **Voice commands for hands-free cooking**: "next", "back", "repeat", "start timer", "pause timer", "ingredients" and "quiet". They use the phone's own speech recognition, so they work in Mise's own app build (not inside Expo Go, which falls back to claps). Mise stops listening while it talks, so it doesn't hear itself.
- **"Hey Mise"** option (Settings → Cook mode): only act on commands that start with "Hey Mise", so kitchen chatter doesn't skip steps.

### Changed
- **More natural voice.** Mise now speaks with the best voice installed on the phone (Apple's Premium and Enhanced voices first) instead of one voice with the pitch shifted. Voice settings list the phone's voices and have a Slower / Normal / Faster setting, plus how to download better voices.
- **Account:** the big Mise Plus card is now a compact **Plan** section with an Upgrade button.
- **Mise Plus page** redesigned like a typical subscription screen: a coloured hero with one of the cooks, what's included, the two plans side by side, how the free week works, and a sticky "Start my free week" button.

## 1.9.0 (2026-10-14)

### Added
- **Hands-free cooking.** Tap the mic button at the top of cook mode. Each step is read out loud in Sous's voice, and the microphone listens for claps: clap twice for the next step, three times to start the step's timer (or hear the step again if it has none). A strip under the progress bar shows what it heard. The 🔊 button reads the step again. Claps only: nothing is recorded or kept. (Spoken commands like "next" need a custom app build and come later.)
- **Mise Plus page** (Account → the purple Mise Plus card, or Subscription): what's included, yearly and monthly plans, and Free vs Plus. Payments aren't connected yet, so the buttons say it's coming soon. Prices are placeholders.

## 1.8.0 (2026-10-13)

### Changed
- **Tab swiping works like Instagram's.** All five tabs sit side by side, and while you swipe, the next page slides in right next to the current one, following your finger, then snaps into place. Tapping a neighbouring tab slides the same way; farther tabs switch instantly.

### Added
- **Ready for Lottie animations.** Drop animation files named after a step action (`mix.json`, `bake.json`…) into `mobile/assets/lottie/` and run `npm run sync-lottie`. Cook mode then plays them instead of the drawn cooks, for every recipe. Extra versions (`mix-2.json`) take turns. The folder's README has the naming table, export settings and ready-to-paste prompts for the LottieFiles AI.

## 1.7.0 (2026-10-13)

### Added
- **Account section** on the Account tab: Sign in & sync (coming soon), Profile (name, cooking level, diet), Notifications (timer alert status with a way to turn it on), and Usage (Import with AI today out of 25, imports this month, messages and voice messages to Sous, chats, recipes, times cooked, timers).
- **Voice** (under App): four voices for Sous's voice mode (Basil, Saffron, Juniper, Clove). Tap one to hear it.
- **Log out** at the bottom of Account (there's nothing to log out of until sign-in arrives).
- **Light / Dark / System** picker with little screen previews in Appearance.

### Changed
- Swiping between tabs now works like a pager: the page follows your finger and glides into the next one. Tapping a tab slides too.
- The cooks stand right at the counter, so their arms reach naturally instead of stretching across the scene.
- "Make it yours" is now "App". Icons in lists no longer have a background.

## 1.6.0 (2026-10-13)

### Added
- **The cooks.** Step pictures are now acted out by three characters (flat, big-head style), taking turns from step to step: stirring at the counter, kneading, waiting sleepily for dough to rise, pointing at the oven in an oven mitt, lifting the pot lid, chopping, flipping the pan, whisking, pouring, shaking salt, fanning the bread, serving, or waving hello.
- **Swipe between tabs** (Recipes, Sous, Add, Timers, Account). Swiping doesn't start from Sous, where a right swipe opens the chat history.
- **Completed** section on Recipes for dishes you've cooked, with how many times and when. Recipe cards show the dish picture.
- **Rename a recipe** by tapping its name.
- **Sous settings** (from the sidebar): answer length, units, cooking level, diet, allergies, and delete all chats. They are saved now and used once Sous is connected.
- **Three new fonts**: Playful, Elegant and Clean.

### Changed
- Sous's header buttons, the ••• menu, the message box and the back-down button are frosted glass, and the chat scrolls underneath them.
- New default look: Plum, Light, Modern font, small text.
- The Add recipe button shows its label for 1.5 s and then shrinks smoothly, finished by 3 s. Its + is smaller and slightly further left.
- All pictures use a flat style without outlines.

### Removed
- The "Cards" option in Appearance.
- The underline under the "Makes" amount.

### Fixed
- Sending a message while the keyboard was still finishing a word (autocorrect or predictive text) could leave part of it behind. Send now waits for the last word.
- Em dashes in recipes (including ones already saved) become commas, and the AI is asked not to use them.

## 1.5.0 (2026-10-13)

### Added
- **Animated step pictures.** A small cartoon scene at the top of each cooking step, chosen from what the step says (stirring, kneading, rising, baking, boiling, chopping, frying, whisking, pouring, seasoning, cooling, serving), with a chef's hat for anything else. They pause when off screen and respect the phone's Reduce Motion setting. You can switch them off in Settings → Step animations.
- **Recipe pictures.** An animated dish (bread, cake, pasta, soup, salad, pizza, cookies, pancakes, or a covered plate) replaces the emoji at the top of a recipe.
- **Type the amount** in "Makes": tap the amount and enter any number.
- **All chats page** (opened from the search button in the history): every chat with "2 hours ago" times, search at the bottom, New chat on the right, long-press for Rename, Pin and Delete.
- **Back-down button** in a chat when you scroll up.
- **Mise icon set**: bolder, rounder icons across the app.

### Changed
- Ticked ingredients get a line through them.
- The Sous message box looks like Claude, ChatGPT and Gemini: a rounded card with the text on top and the buttons underneath.
- The ••• menu no longer shows the chat name, and it grows out of the button and shrinks back when closing.
- The sidebar's New chat button sits on the right and is only as wide as it needs to be.
- Removed: the text under Sign in & sync, the alarm notes in Settings and the tone picker, and "Test the alarm".
- Em dashes removed from the app's text.

### Fixed
- The chat screen shifted slightly (and text re-wrapped) while the history slid open or closed.

## 1.4.0 (2026-10-12)

### Added
- **＋ sheet in Sous** (like Gemini and ChatGPT): big Camera, Photos and Recipes tiles, plus starters (Plan meals, Use what I have, Swap an ingredient, Rescue a dish) that drop a prompt into the message box. Drag down to close.
- **••• menu in an open chat**: Share, Rename, Pin and Delete, with the chat's name on top.
- **Recipe prompt page**: how to use it, the full prompt, Copy, Edit and Restore. (Editing moved here from Settings.)
- **Help center** with searchable questions and answers.
- **Report an issue** form.
- **Terms of Use and Privacy Policy** under About (drafts to review before publishing).

### Changed
- Sous's answers are plain text across the page: no bubble, border or avatar.
- Sous header: round ☰ on the left, a pill with a new compose icon and ••• on the right, and no chat name.
- The history sidebar's account button is replaced by a voice-mode button.
- Account: one icon size everywhere, no subtitles, a Support section (Help center, Report an issue, Send feedback), and "About Mise" is now "About". The Feedback button is a normal row.

## 1.3.0 (2026-10-12)

### Changed
- **Running timer at the top.** The Dynamic Island-style pill now grows in at the top of the screen instead of sitting at the bottom. With several timers it shows the next one to ring and a "+N" for the rest (tap it to see them all). It hides on the Timers screens, which already list them.
- **Chat history opens like the Claude app.** Swipe right on the Sous chat and the whole app, tab bar included, slides right with your finger to uncover your chats. Swipe left or tap the strip on the right to close.
- "Look" is now called **Appearance**.
- The Feedback card on Account uses a normal icon instead of an emoji.

### Fixed
- The greeting showed only part of some names (it split names on the letter "s").

## 1.2.0 (2026-10-12)

### Added
- **Greeting by time of day:** "Good morning / afternoon / evening, {name}" (or "Hi" late at night) with a matching nudge, instead of "Hi, I'm Sous".
- **Smart chat names** made from the first message, like AI apps ("Buttermilk substitute", "Sticky bread dough fix"). A chat that starts with a voice message is "Voice chat" until something is typed. The open chat's name shows in the header.
- **Search in chat history** across chat names and messages, with the matching words shown.
- **Long-press a chat** for Rename, Pin / Unpin and Delete. Pinned chats sit in their own section.
- **Swipe right** on the chat screen to open the history; swipe the history left to close it.

### Changed
- The history drawer is redesigned after AI-app sidebars: big title, round search button, Pinned and Recents, account button and a floating "New chat" pill.
- The voice-mode button uses a sound-wave icon.
- The Edit button in chat history is gone (long-press replaces it).

## 1.1.0 (2026-10-12)

### Added
- **Sous, the built-in sous-chef (preview).** New AI chat tab with chat history (new chat, swipe or Edit to delete), voice messages with a live level meter, a hands-free voice mode, and photo / recipe attachments. Not connected to an AI yet: Sous answers with a placeholder.
- **Several timers at once, iPhone Clock style.** Running timers show as a list with ＋ to add another. Each row has its own pause button and a small Ring / Clock / Sand face (tap it to switch style). Tap a timer for its own page with Label, "When Timer Ends" and +1 min.
- **Alarm tones:** Chime, Bell, Beeps or Vibrate only, each previewed when chosen.
- **Dynamic Island-style running timer** at the bottom of the screen.
- **Own pages for Look, Settings, About Mise and Feedback**, reached from separate sections on the Account tab.

### Changed
- Tab bar order: Recipes · Sous · Add · Timers · Account. The Recipes book opens when you're on it and closes when you leave.
- Swipe to delete now shows a round red trash button, and lists have an iOS-style Edit mode.

### Removed
- Timer history (Recents) on the Timers tab.

## 1.0.0

- First version: paste a recipe and get big step-by-step cards with timers, cook mode, a customisable look, the Timers and Account tabs, and AI import (link, photo, text) through a protected server.
