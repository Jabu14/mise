// Help center content: topics → sections → articles. Article text can link with
// [label](article:<id>) to another article or [label](/route) to a screen in the app.
import type { IconName } from '../components/ui';
import { AI_NAME } from './chat-store';

export type Block = { p: string } | { h: string } | { bullets: string[] } | { steps: string[] } | { note: string };
export type Article = { id: string; title: string; blocks: Block[]; related?: string[] };
export type Section = { id: string; title: string; icon: IconName; articles: Article[] };
export type Topic = { id: string; title: string; icon: IconName; sections: Section[] };

export const HELP: Topic[] = [
  {
    id: 'start', title: 'Get started', icon: 'flag',
    sections: [
      {
        id: 'accounts', title: 'Accounts and sign-in', icon: 'person-circle',
        articles: [
          { id: 'create-account', title: 'How to create an account', related: ['sign-in-trouble', 'where-saved'], blocks: [
            { p: 'You need a Mise account to use the app. Creating one takes a few seconds.' },
            { steps: ['Open Mise. You’ll see the sign-in screen.', 'Tap Create account.', 'Enter your name, your email and a password with at least 8 characters.', 'Tap Create account. Mise opens straight away.'] },
            { note: 'While Mise is in early access, accounts are kept on this phone. When online accounts arrive, you’ll be able to sign in on any device.' },
            { p: 'Your name shows on the [Account tab](/account) and you can change it any time in [Profile](/profile).' },
          ] },
          { id: 'sign-in-trouble', title: 'Can’t sign in', related: ['create-account', 'switch-accounts'], blocks: [
            { p: 'If Mise says your email and password don’t match:' },
            { bullets: ['Check the email for typos and extra spaces.', 'Passwords are case-sensitive. Tap the eye in the password box to see what you typed.', 'Accounts made in early access live on the phone they were created on. If you’re on a new phone, create a new account.'] },
            { p: 'Forgot your password? Tap Forgot password? on the sign-in screen. Once online accounts are switched on, we’ll email you a link to choose a new one.' },
          ] },
          { id: 'switch-accounts', title: 'Switch accounts or sign out', related: ['create-account', 'delete-account'], blocks: [
            { p: 'On the [Account tab](/account), tap your name. A sheet shows who you’re signed in as.' },
            { bullets: ['Add another account: sign in to a different account on this phone.', 'Edit profile: change your name and picture.', 'Sign out: you go back to the sign-in screen.'] },
            { note: 'Signing out doesn’t delete anything. Your recipes, plans and journal stay on this phone.' },
          ] },
          { id: 'delete-account', title: 'Delete your account', related: ['your-data'], blocks: [
            { p: 'Go to [Profile](/profile) and tap Delete account at the bottom, then confirm.' },
            { p: 'Deleting an account removes the account itself. The recipes, plans and journal on this phone stay until you delete them or the app.' },
          ] },
        ],
      },
      {
        id: 'first-recipe', title: 'Your first recipe', icon: 'book',
        articles: [
          { id: 'add-recipe', title: 'How to add a recipe', related: ['ai-import', 'mise-prompt', 'edit-recipe'], blocks: [
            { p: 'Tap Add in the middle of the navigation bar. There are three ways to bring a recipe in:' },
            { bullets: ['Paste: copy a recipe from a website, a note or a message and paste it. Mise splits it into ingredients and steps, and finds the timers.', 'Import with AI: give Mise a link, a photo of a cookbook page or messy text, and it tidies it up for you.', 'Try the sample: the Easy Crusty Bread recipe shows what a finished recipe looks like.'] },
            { p: 'Before saving you can check the title, ingredients and steps. You can always [edit a recipe](article:edit-recipe) later.' },
          ] },
          { id: 'ai-import', title: 'Import a recipe with AI', related: ['add-recipe', 'usage'], blocks: [
            { p: 'On the Add tab, choose Import with AI. Share a link, take or choose a photo (up to 3), or paste text.' },
            { p: 'Mise reads it, writes clean steps with timers, and shows you the result to check before saving.' },
            { note: 'AI imports count towards your daily limit. See [Usage](/usage) for how many you have left.' },
          ] },
          { id: 'mise-prompt', title: 'What is the Mise Prompt?', related: ['add-recipe'], blocks: [
            { p: 'The Mise Prompt is a short instruction you can paste into any AI chat (like ChatGPT or Claude) after asking it for a recipe. The AI then answers in the exact format Mise reads perfectly.' },
            { steps: ['Ask your AI chat for a recipe.', 'Paste the [Mise Prompt](/recipe-prompt) as your next message.', 'Copy the AI’s answer and paste it on the Add tab.'] },
          ] },
          { id: 'edit-recipe', title: 'Edit or delete a recipe', related: ['collections'], blocks: [
            { p: 'Open the recipe and use the buttons at the top: the pencil to edit, the bin to delete. Tap the title on the recipe page to rename it quickly.' },
          ] },
        ],
      },
      {
        id: 'navigating', title: 'Finding your way around', icon: 'compass',
        articles: [
          { id: 'tabs', title: 'The five tabs', related: ['navbar-lens'], blocks: [
            { bullets: ['Recipes: everything you’ve saved, recipes you’ve finished under Completed, your meal plan and shopping list.', `${AI_NAME}: your cooking assistant.`, 'Add: bring in a new recipe.', 'Timers: kitchen timers that ring even when your phone is locked.', 'Account: your profile, history, settings and help.'] },
            { p: 'You can also swipe left and right to move between tabs.' },
          ] },
          { id: 'navbar-lens', title: 'Slide along the navigation bar', related: ['tabs'], blocks: [
            { p: 'Press and hold the navigation bar, or slide your finger along it. A glass lens lifts out and follows your finger. Let go to open the tab under it.' },
          ] },
        ],
      },
      {
        id: 'troubleshooting', title: 'Troubleshooting', icon: 'help-circle',
        articles: [
          { id: 'where-saved', title: 'Where are my recipes saved?', related: ['your-data'], blocks: [
            { p: 'Everything (recipes, plans, your journal and chats) is saved on this phone. Deleting the app deletes them, so keep a copy of the ones you love, for example by [sharing them with a QR code](article:qr-share).' },
            { note: 'Sync across devices is coming. Once it arrives, signing in will bring your recipes to any phone.' },
          ] },
          { id: 'app-slow', title: 'Mise is slow or something looks wrong', related: ['report-problem'], blocks: [
            { bullets: ['Close Mise completely and open it again.', 'Make sure your phone has the latest iOS or Android update.', 'If a screen keeps going wrong, [report it](article:report-problem) with a screenshot or screen recording.'] },
          ] },
          { id: 'report-problem', title: 'Report a problem', related: ['app-slow'], blocks: [
            { p: 'Go to Account → Help & legal → [Report an issue](/feedback?mode=issue). Describe what happened and attach screenshots or screen recordings, up to 5.' },
            { p: 'We add the app version and your phone type automatically so we can fix it faster.' },
          ] },
        ],
      },
    ],
  },
  {
    id: 'recipes', title: 'Recipes', icon: 'book',
    sections: [
      {
        id: 'recipe-page', title: 'The recipe page', icon: 'document-text',
        articles: [
          { id: 'scale', title: 'Make more or less', related: ['units'], blocks: [
            { p: 'On a recipe, use − and + next to Makes. Every ingredient amount updates, and so do amounts in the steps.' },
            { p: 'Tap the Makes number to type an exact amount.' },
          ] },
          { id: 'units', title: 'Show a recipe in cups or grams', related: ['scale', 'swaps'], blocks: [
            { p: 'Pick As written, Metric or US above the ingredients, or in [Settings → Units](/settings?section=units).' },
            { bullets: ['Metric shows grams, millilitres, °C and centimetres.', 'US shows ounces, pounds, cups, °F and inches.', 'Oven temperatures snap to the usual dial steps, so 220°C shows as 425°F.'] },
            { note: 'Teaspoons and tablespoons stay as they are, and small gram amounts (like 7 g of yeast) stay in grams because ounces would be too rough.' },
          ] },
          { id: 'swaps', title: 'Missing an ingredient? Use a swap', related: ['units'], blocks: [
            { p: 'Tap ⇄ next to an ingredient to see common swaps, like milk and lemon juice for buttermilk, or flax “eggs”.' },
            { p: `For anything else, tap Ask ${AI_NAME} about it and ${AI_NAME} opens with your question ready.` },
          ] },
          { id: 'ready-by', title: 'Plan when to start cooking', related: ['prep'], blocks: [
            { p: 'Tap Ready by… under the recipe’s title and choose when you want to eat. Mise works backwards and shows when to start each step.' },
            { p: 'Tap Remind me and you’ll get a notification when it’s time to begin.' },
            { note: 'Times are estimates: each step takes as long as its timer, plus about 5 minutes for hands-on work.' },
          ] },
        ],
      },
      {
        id: 'organizing', title: 'Organizing your recipes', icon: 'folder',
        articles: [
          { id: 'collections', title: 'Collections', related: ['qr-share'], blocks: [
            { p: 'Group recipes into collections like Weeknight, Baking or Mum’s recipes.' },
            { steps: ['Open a recipe.', 'Tap Add to collection under the title.', 'Pick a collection or type a new name.'] },
            { p: 'Your collections appear as filters at the top of the Recipes tab. You can share a whole collection as a [cookbook QR code](article:qr-share).' },
          ] },
          { id: 'completed', title: 'What “Completed” means', related: ['journal'], blocks: [
            { p: 'When you finish a recipe in cook mode, it moves to Completed on the Recipes tab, with how many times you’ve made it.' },
          ] },
        ],
      },
    ],
  },
  {
    id: 'cooking', title: 'Cooking', icon: 'flame',
    sections: [
      {
        id: 'cook-mode', title: 'Cook mode', icon: 'restaurant',
        articles: [
          { id: 'cook-mode-basics', title: 'Using cook mode', related: ['hands-free', 'prep'], blocks: [
            { p: 'Tap Start cooking on a recipe. You see one big step at a time with its timers and the ingredients it needs.' },
            { bullets: ['Swipe or tap Next step to move on.', 'Tap a timer to start it.', 'Tap the list button at the top to see all ingredients.', 'Your screen stays on while you cook.'] },
            { p: 'Prefer to see everything? Switch to All steps in a list in [Settings → Cook mode](/settings?section=cook).' },
          ] },
          { id: 'prep', title: 'Mise en place (Prep)', related: ['cook-mode-basics'], blocks: [
            { p: 'Tap Prep on a recipe to get everything ready first: preheat the oven, get out the equipment, do the chopping, and put each ingredient on the counter.' },
            { p: 'Tick things off as you go. When everything is ticked, start cooking without stopping.' },
          ] },
        ],
      },
      {
        id: 'hands-free-section', title: 'Hands-free', icon: 'mic',
        articles: [
          { id: 'hands-free', title: 'Cook hands-free', related: ['cook-mode-basics'], blocks: [
            { p: 'Tap the mic in cook mode. Mise reads each step aloud.' },
            { bullets: ['In the Mise app: say “next”, “back”, “repeat”, “start timer” or “ingredients”.', 'In the Expo Go preview: clap twice for the next step, three times for the timer.'] },
            { p: 'Turn on Wait for “Hey Mise” in [Settings → Hands-free](/settings?section=handsfree) so kitchen chatter doesn’t skip steps.' },
          ] },
        ],
      },
      {
        id: 'journal-section', title: 'Journal and streaks', icon: 'trophy',
        articles: [
          { id: 'journal', title: 'Your cooking journal', related: ['streak'], blocks: [
            { p: 'When you finish a recipe, the All done! screen asks how it went: give it stars, add a photo and write notes for next time.' },
            { p: 'Your notes appear on step 1 the next time you cook that recipe. See every cook in Account → Your kitchen → Cooked.' },
          ] },
          { id: 'streak', title: 'Cooking streaks', related: ['journal'], blocks: [
            { p: 'A streak counts weeks in a row where you cooked at least once. Finish a recipe in cook mode each week to keep it going.' },
            { p: 'See your streak, your best run and the last 12 weeks in Account → Your kitchen → Cooking streak.' },
          ] },
        ],
      },
    ],
  },
  {
    id: 'timers', title: 'Timers and alarms', icon: 'timer',
    sections: [
      {
        id: 'using-timers', title: 'Using timers', icon: 'timer',
        articles: [
          { id: 'timer-basics', title: 'Start, pause and add time', related: ['timer-ring'], blocks: [
            { p: 'Start a timer from a step in cook mode, or on the Timers tab with the wheel. You can run several at once.' },
            { bullets: ['Tap a running timer to pause or resume it.', 'Use +1 min to add time.', 'The next timer to ring shows at the top of every screen.'] },
          ] },
        ],
      },
      {
        id: 'alarms', title: 'Alarms and notifications', icon: 'notifications',
        articles: [
          { id: 'timer-ring', title: 'Will my timer ring if I leave the app?', related: ['no-sound'], blocks: [
            { p: 'Yes. Mise sends a notification when a timer ends, even with the phone locked or the app closed. Allow notifications for Mise when asked.' },
          ] },
          { id: 'no-sound', title: 'I don’t hear the alarm', related: ['timer-ring'], blocks: [
            { bullets: ['Check notifications are on in [Account → Notifications](/notifications).', 'Turn your volume up and silent mode off.', 'Focus or Do Not Disturb can silence notifications.', 'Pick a louder tone in [Settings → Timers & alarms](/settings?section=timers).'] },
          ] },
        ],
      },
    ],
  },
  {
    id: 'planning', title: 'Planning and shopping', icon: 'calendar',
    sections: [
      {
        id: 'meal-plan', title: 'Meal plan', icon: 'calendar',
        articles: [
          { id: 'plan-meals', title: 'Plan your meals', related: ['plan-reminders', 'shopping-list'], blocks: [
            { p: 'Tap the calendar on the Recipes tab. Pick a day, then tap Add next to Breakfast, Lunch or Dinner and choose a recipe or type something like “Leftovers”.' },
            { p: 'Days with meals planned get dots. From a recipe, tap the calendar at the top to add it to any day.' },
          ] },
          { id: 'plan-reminders', title: 'Meal plan reminders', related: ['plan-meals'], blocks: [
            { p: 'On days you’ve planned meals, Mise sends a note with what’s on, at 9 AM, noon or 4 PM. Change it in [Account → Notifications](/notifications).' },
          ] },
        ],
      },
      {
        id: 'shopping', title: 'Shopping list', icon: 'cart',
        articles: [
          { id: 'shopping-list', title: 'How the shopping list works', related: ['plan-meals', 'scanner'], blocks: [
            { p: 'Tap Add to shopping list on a recipe, or add a whole week from the meal plan. Matching ingredients are combined (two recipes’ flour becomes one line) and sorted by aisle.' },
            { bullets: ['Tap an item to tick it off.', 'Swipe left to remove one.', 'Type your own items at the top.', 'Share the list from the ••• menu.'] },
          ] },
          { id: 'what-can-i-make', title: 'What can I make?', related: ['shopping-list'], blocks: [
            { p: 'Tap What can I make? on the Recipes tab and add what’s in your fridge. Your recipes are sorted by how little you’re missing. Salt, pepper, oil and water always count.' },
          ] },
        ],
      },
      {
        id: 'scanner-section', title: 'Nutrition scanner', icon: 'barcode',
        articles: [
          { id: 'scanner', title: 'Scan packaged food', related: ['shopping-list'], blocks: [
            { p: 'Open your shopping list and tap the barcode button. Point the camera at the barcode on a package.' },
            { p: 'You’ll see its Nutri-Score, how processed it is, fat, sugar and salt levels, nutrition per 100 g and allergens.' },
            { note: 'Product information comes from Open Food Facts, a free database anyone can improve. Some products may be missing.' },
          ] },
        ],
      },
    ],
  },
  {
    id: 'sous', title: AI_NAME, icon: 'sparkles',
    sections: [
      {
        id: 'about-sous', title: `About ${AI_NAME}`, icon: 'sparkles',
        articles: [
          { id: 'sous-what', title: `What can ${AI_NAME} do?`, related: ['sous-knows', 'usage'], blocks: [
            { p: `${AI_NAME} is your cooking assistant. Ask about substitutions, timing, techniques or what to cook. You can type, send a voice message or talk in voice mode.` },
            { note: `${AI_NAME} is in preview: chat and voice work, and real answers are coming soon.` },
          ] },
          { id: 'sous-knows', title: `What ${AI_NAME} knows about you`, related: ['your-data'], blocks: [
            { p: `Go to Account → ${AI_NAME} settings and tap What ${AI_NAME} knows about you to see it word for word: your cooking level, diet and allergies, and (if you allow them) your recipes, meal plan and journal.` },
            { p: 'Turn any of these off there and they’re left out.' },
          ] },
          { id: 'usage', title: 'Usage and limits', related: ['plans'], blocks: [
            { p: 'Some AI features have a daily limit. [Usage](/usage) shows how much you’ve used and when it resets.' },
          ] },
        ],
      },
      {
        id: 'chats', title: 'Chats', icon: 'chatbubbles',
        articles: [
          { id: 'manage-chats', title: 'Rename, pin or delete a chat', related: ['qr-share'], blocks: [
            { p: `Open your chat history (swipe right in ${AI_NAME}, or tap ☰), then long-press a chat for Rename, Pin and Delete. In an open chat, tap ••• at the top.` },
          ] },
        ],
      },
    ],
  },
  {
    id: 'sharing', title: 'Sharing', icon: 'qr-code',
    sections: [
      {
        id: 'qr', title: 'QR codes', icon: 'qr-code',
        articles: [
          { id: 'qr-share', title: 'Share with a QR code', related: ['qr-scan', 'collections'], blocks: [
            { p: 'On the Account tab, tap the QR button at the top. Choose what to share:' },
            { bullets: ['A recipe', 'A cookbook (a collection)', 'Your shopping list', `A ${AI_NAME} chat`, 'Your kitchen setup (colours, font, units and cook mode)'] },
            { p: 'Show the code to someone. Everything is inside the code, so it works without internet.' },
          ] },
          { id: 'qr-scan', title: 'Scan someone’s code', related: ['qr-share'], blocks: [
            { p: 'On the QR share screen, tap Scan someone’s code and point the camera at their screen. You’ll see what they shared and can save a copy.' },
            { note: 'Mise only opens Mise codes. Other QR codes (websites, Wi-Fi) are ignored.' },
          ] },
        ],
      },
    ],
  },
  {
    id: 'privacy', title: 'Privacy, safety and security', icon: 'lock-closed',
    sections: [
      {
        id: 'data', title: 'Your data', icon: 'shield-checkmark',
        articles: [
          { id: 'your-data', title: 'What Mise keeps and where', related: ['where-saved', 'delete-account'], blocks: [
            { p: 'Your recipes, plans, journal, chats and settings are saved on your phone. Your sign-in is kept in your phone’s secure storage (the Keychain on iPhone).' },
            { bullets: ['The nutrition scanner sends only the barcode to Open Food Facts.', 'Feedback you send includes the app version and phone type.', 'AI features send what you ask to Mise’s server to get an answer.'] },
            { p: 'Read the full [Terms and Privacy Policy](/legal).' },
          ] },
        ],
      },
    ],
  },
  {
    id: 'plans', title: 'Plans and payments', icon: 'card',
    sections: [
      {
        id: 'mise-plus', title: 'Mise Plus', icon: 'sparkles',
        articles: [
          { id: 'plans', title: 'Mise Plus, Pro and Chef', related: ['usage'], blocks: [
            { p: 'Paid plans will add more AI imports, a smarter Sous and more. See them in [Upgrade to Mise Plus](/plus).' },
            { note: 'Plans aren’t on sale yet. Nothing is charged.' },
          ] },
        ],
      },
    ],
  },
  {
    id: 'customize', title: 'Customize Mise', icon: 'color-palette',
    sections: [
      {
        id: 'look', title: 'Look and feel', icon: 'color-palette',
        articles: [
          { id: 'appearance', title: 'Colours, dark mode and fonts', related: ['settings-pages'], blocks: [
            { p: 'Go to Account → [Appearance](/appearance). Pick a colour, light, dark or system, a font and a text size.' },
          ] },
          { id: 'settings-pages', title: 'Settings', related: ['appearance'], blocks: [
            { p: 'Account → App has a page for each kind of setting:' },
            { bullets: ['Cook mode: layout, step pictures and what each step shows.', 'Units: metric, US or as written.', 'Hands-free: reading aloud and voice commands.', 'Timers & alarms: the sound when a timer ends.', 'Vibration: little taps when you press things.'] },
          ] },
        ],
      },
    ],
  },
];

export const ALL_ARTICLES = HELP.flatMap(t => t.sections.flatMap(s => s.articles.map(a => ({ ...a, topic: t, section: s }))));
export const findArticle = (id: string) => ALL_ARTICLES.find(a => a.id === id);
export const findSection = (id: string) => HELP.flatMap(t => t.sections.map(s => ({ ...s, topic: t }))).find(s => s.id === id);
export const articleText = (a: Article) => a.blocks.map(b => ('p' in b ? b.p : 'h' in b ? b.h : 'note' in b ? b.note : 'bullets' in b ? b.bullets.join(' ') : b.steps.join(' '))).join(' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
export const POPULAR = ['add-recipe', 'units', 'timer-ring', 'qr-share', 'plan-meals'];
