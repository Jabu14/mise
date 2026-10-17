// Help center: common questions, each opens to its answer, plus a way to report a problem.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Btn, Card, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { useTheme } from '../lib/theme';

const FAQ: { q: string; a: string }[] = [
  { q: 'How do I share a recipe with a QR code?', a: 'Account → the QR button at the top. Pick a recipe, a cookbook (collection), your shopping list, a Sous chat or your kitchen setup, and show the code. The other person scans it in Mise (the scan button on that screen, or the barcode scanner) and saves a copy. Everything is inside the code, so no internet is needed.' },
  { q: 'Do I need an account?', a: 'No. Everything works without one. Signing in will let your recipes follow you to other devices once sync arrives. Tap “Sign in or create account” on the Account tab.' },
  { q: 'How do I know when to start cooking?', a: 'On a recipe, tap “Ready by…”, choose when you want to eat, and Mise works backwards to when each step should start. Tap “Remind me” to get a notification when it’s time to begin.' },
  { q: 'How do I find a recipe for what’s in my fridge?', a: 'On the Recipes page, tap “What can I make?” and add what you have. Your saved recipes are sorted by how little you’re missing. Salt, pepper, oil and water are always counted.' },
  { q: 'How do collections work?', a: 'On a recipe, tap “Add to collection” and pick one or type a new name. Your collections show as filters at the top of the Recipes page.' },
  { q: 'Can I see a recipe in cups or grams?', a: 'Yes. On a recipe, pick As written, Metric or US above the ingredients (or in Settings → Cook mode → Units). Weights, volumes, lengths and oven temperatures change everywhere, including cook mode. Teaspoons and tablespoons stay, and small gram amounts stay in grams.' },
  { q: 'What if I’m missing an ingredient?', a: 'Tap the ⇄ button next to it for common swaps, like milk and lemon juice for buttermilk. “Ask Sous about it” opens Sous with the question ready.' },
  { q: 'What is the Prep button?', a: 'Mise en place: before you cook, it lists what to do first (preheat the oven, get out the equipment), the chopping and softening, and every ingredient to put on the counter. Tick things off, then start cooking.' },
  { q: 'Can Mise remind me what I planned?', a: 'Yes. On days you’ve planned meals, Mise sends a note at 9 AM, noon or 4 PM (your choice) with what’s on. If you leave a recipe halfway, you get a nudge a few hours later. Turn either off in Account → Notifications → Reminders.' },
  { q: `What does ${AI_NAME} know about me?`, a: `Open Account → ${AI_NAME} settings and tap “What ${AI_NAME} knows about you” to see it word for word: your cooking level, diet and allergies, and (if you allow them) your saved recipes, meal plan and cooking journal.` },
  { q: 'How do I plan my meals?', a: 'Tap the calendar on the Recipes page. Pick a day on the calendar (swipe or use the arrows to change month), then tap Add next to Breakfast, Lunch or Dinner to add a saved recipe or a note like “Leftovers”. Days with plans have dots. “Add this week to my shopping list” adds every planned recipe in that week at once. From a recipe, the calendar button at the top adds it to a day.' },
  { q: 'What is the cooking journal?', a: 'Every time you finish a recipe in cook mode it’s saved to your journal. Rate it, add a photo and write notes for next time; your notes show up on step 1 the next time you cook it. Open the journal from “Journal” next to Completed on the Recipes page.' },
  { q: 'How do I scan food?', a: 'Open your shopping list and tap the barcode button (or ＋ › Scan food in Sous). Point the camera at the barcode on a package to see its Nutri-Score, how processed it is, sugar, fat and salt levels, and allergens. You can also type the barcode number.' },
  { q: 'How does the shopping list work?', a: 'Open a recipe and tap “Add to shopping list”. Matching ingredients from different recipes are combined and sorted by aisle. Open the list from the cart button on the Recipes page, tap items to tick them off, and swipe left to remove one.' },
  { q: 'How do I add a recipe?', a: 'Tap ＋ in the middle of the tab bar. Paste a recipe, or use Import with AI to bring one in from a link, a photo or text. Mise splits it into steps with timers.' },
  { q: 'What is the Mise Prompt?', a: 'A short instruction you paste into any AI chat after asking for a recipe. The AI then answers in a format Mise reads perfectly. Find it in Account → Sous → Mise Prompt.' },
  { q: 'Will my timer ring if I leave the app?', a: 'Yes. Mise sends a notification when a timer ends, even with the phone locked. Allow notifications for Mise when asked, or turn them on in your phone’s Settings.' },
  { q: 'Why don’t I hear the alarm?', a: 'Make sure notifications are allowed for Mise, and check your volume and Focus settings. You can choose the tone in Settings → When Timer Ends.' },
  { q: 'Can I run more than one timer?', a: 'Yes. On the Timers tab, tap ＋ to add another while others keep running. The next one to ring shows at the top of the screen.' },
  { q: 'Where are my recipes saved?', a: 'On this phone only. Sign-in and sync across devices are coming later. Deleting the app deletes your recipes, so keep a copy of the ones you love.' },
  { q: `Is ${AI_NAME} connected yet?`, a: `Not yet. ${AI_NAME} is a preview: you can try chat, voice messages and voice mode, and real answers are coming soon.` },
  { q: 'How do I change colours and fonts?', a: 'Account → Appearance. Pick a colour, light or dark, a font, text size and card style, with a live preview at the top.' },
  { q: 'How do I delete or rename a chat?', a: `Open the history (swipe right in ${AI_NAME}, or tap ☰), then long-press a chat for Rename, Pin and Delete. In an open chat, tap ••• at the top.` },
];

export default function HelpScreen() {
  const th = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const items = q ? FAQ.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)) : FAQ;

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Help center</Txt>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 14, borderRadius: 23, backgroundColor: th.c.soft }}>
          <Icon name="search" size={18} color={th.c.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search help" placeholderTextColor={th.c.muted} maxLength={80}
            style={[{ flex: 1, minWidth: 0, color: th.c.text, fontSize: th.fs(16), paddingVertical: 0 }, th.f('body')]} />
        </View>

        <Card style={{ paddingHorizontal: 4 }}>
          {items.map((f, i) => {
            const on = open === f.q || !!q;
            return (
              <Pressable key={f.q} onPress={() => setOpen(on && !q ? null : f.q)} accessibilityRole="button" accessibilityState={{ expanded: on }}
                style={{ paddingHorizontal: 12, paddingVertical: 14, gap: 8, borderBottomWidth: i === items.length - 1 ? 0 : 1, borderBottomColor: th.c.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Txt weight="bold" style={{ flex: 1 }}>{f.q}</Txt>
                  <Icon name={on ? 'chevron-up' : 'chevron-down'} size={18} color={th.c.muted} />
                </View>
                {on ? <Txt muted size={15} style={{ lineHeight: 22 }}>{f.a}</Txt> : null}
              </Pressable>
            );
          })}
          {!items.length ? <Txt muted style={{ padding: 16 }}>No answers match “{query.trim()}”.</Txt> : null}
        </Card>

        <View style={{ alignItems: 'center', gap: 10, paddingTop: 8 }}>
          <Txt weight="bold">Still stuck?</Txt>
          <Btn title="Report an issue" icon="bug-outline" variant="secondary" onPress={() => router.push('/feedback?mode=issue')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
