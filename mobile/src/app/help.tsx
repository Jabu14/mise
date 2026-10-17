// Help center: questions grouped into topics (each with its icon), a search, and ways to get in touch.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Card, Icon, IconBtn, PageTitle, Screen, TopBar, Txt, type IconName } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { useTheme } from '../lib/theme';

type Topic = 'start' | 'cook' | 'plan' | 'timers' | 'sous' | 'app';
const FAQ: { t: Topic; q: string; a: string }[] = [
  { t: 'app', q: 'How do I share a recipe with a QR code?', a: 'Account → the QR button at the top. Pick a recipe, a cookbook (collection), your shopping list, a Sous chat or your kitchen setup, and show the code. The other person taps “Scan someone’s code” on that screen, points the QR scanner at it and saves a copy. Everything is inside the code, so no internet is needed.' },
  { t: 'start', q: 'Do I need an account?', a: 'No. Everything works without one. Signing in will let your recipes follow you to other devices once sync arrives. Tap “Sign in or create account” on the Account tab.' },
  { t: 'cook', q: 'How do I know when to start cooking?', a: 'On a recipe, tap “Ready by…”, choose when you want to eat, and Mise works backwards to when each step should start. Tap “Remind me” to get a notification when it’s time to begin.' },
  { t: 'plan', q: 'How do I find a recipe for what’s in my fridge?', a: 'On the Recipes page, tap “What can I make?” and add what you have. Your saved recipes are sorted by how little you’re missing. Salt, pepper, oil and water are always counted.' },
  { t: 'plan', q: 'How do collections work?', a: 'On a recipe, tap “Add to collection” and pick one or type a new name. Your collections show as filters at the top of the Recipes page.' },
  { t: 'cook', q: 'Can I see a recipe in cups or grams?', a: 'Yes. On a recipe, pick As written, Metric or US above the ingredients (or in Settings → Cook mode → Units). Weights, volumes, lengths and oven temperatures change everywhere, including cook mode. Teaspoons and tablespoons stay, and small gram amounts stay in grams.' },
  { t: 'cook', q: 'What if I’m missing an ingredient?', a: 'Tap the ⇄ button next to it for common swaps, like milk and lemon juice for buttermilk. “Ask Sous about it” opens Sous with the question ready.' },
  { t: 'cook', q: 'What is the Prep button?', a: 'Mise en place: before you cook, it lists what to do first (preheat the oven, get out the equipment), the chopping and softening, and every ingredient to put on the counter. Tick things off, then start cooking.' },
  { t: 'plan', q: 'Can Mise remind me what I planned?', a: 'Yes. On days you’ve planned meals, Mise sends a note at 9 AM, noon or 4 PM (your choice) with what’s on. If you leave a recipe halfway, you get a nudge a few hours later. Turn either off in Account → Notifications → Reminders.' },
  { t: 'cook', q: `What does ${AI_NAME} know about me?`, a: `Open Account → ${AI_NAME} settings and tap “What ${AI_NAME} knows about you” to see it word for word: your cooking level, diet and allergies, and (if you allow them) your saved recipes, meal plan and cooking journal.` },
  { t: 'plan', q: 'How do I plan my meals?', a: 'Tap the calendar on the Recipes page. Pick a day on the calendar (swipe or use the arrows to change month), then tap Add next to Breakfast, Lunch or Dinner to add a saved recipe or a note like “Leftovers”. Days with plans have dots. “Add this week to my shopping list” adds every planned recipe in that week at once. From a recipe, the calendar button at the top adds it to a day.' },
  { t: 'cook', q: 'What is the cooking journal?', a: 'Every time you finish a recipe in cook mode it’s saved to your journal. Rate it, add a photo and write notes for next time; your notes show up on step 1 the next time you cook it. Open the journal from “Journal” next to Completed on the Recipes page.' },
  { t: 'plan', q: 'How do I scan food?', a: 'Open your shopping list and tap the barcode button (or ＋ › Scan food in Sous). Point the camera at the barcode on a package to see its Nutri-Score, how processed it is, sugar, fat and salt levels, and allergens. You can also type the barcode number.' },
  { t: 'plan', q: 'How does the shopping list work?', a: 'Open a recipe and tap “Add to shopping list”. Matching ingredients from different recipes are combined and sorted by aisle. Open the list from the cart button on the Recipes page, tap items to tick them off, and swipe left to remove one.' },
  { t: 'start', q: 'How do I add a recipe?', a: 'Tap ＋ in the middle of the tab bar. Paste a recipe, or use Import with AI to bring one in from a link, a photo or text. Mise splits it into steps with timers.' },
  { t: 'start', q: 'What is the Mise Prompt?', a: 'A short instruction you paste into any AI chat after asking for a recipe. The AI then answers in a format Mise reads perfectly. Find it in Account → Sous → Mise Prompt.' },
  { t: 'timers', q: 'Will my timer ring if I leave the app?', a: 'Yes. Mise sends a notification when a timer ends, even with the phone locked. Allow notifications for Mise when asked, or turn them on in your phone’s Settings.' },
  { t: 'timers', q: 'Why don’t I hear the alarm?', a: 'Make sure notifications are allowed for Mise, and check your volume and Focus settings. You can choose the tone in Settings → When Timer Ends.' },
  { t: 'timers', q: 'Can I run more than one timer?', a: 'Yes. On the Timers tab, tap ＋ to add another while others keep running. The next one to ring shows at the top of the screen.' },
  { t: 'start', q: 'Where are my recipes saved?', a: 'On this phone only. Sign-in and sync across devices are coming later. Deleting the app deletes your recipes, so keep a copy of the ones you love.' },
  { t: 'sous', q: `Is ${AI_NAME} connected yet?`, a: `Not yet. ${AI_NAME} is a preview: you can try chat, voice messages and voice mode, and real answers are coming soon.` },
  { t: 'app', q: 'How do I change colours and fonts?', a: 'Account → Appearance. Pick a colour, light or dark, a font, text size and card style, with a live preview at the top.' },
  { t: 'sous', q: 'How do I delete or rename a chat?', a: `Open the history (swipe right in ${AI_NAME}, or tap ☰), then long-press a chat for Rename, Pin and Delete. In an open chat, tap ••• at the top.` },
];

const TOPICS: [Topic, string, IconName, string][] = [
  ['start', 'Getting started', 'rocket-outline', 'Accounts, adding recipes, where things are saved'],
  ['cook', 'Cooking', 'flame-outline', 'Prep, units, swaps, timing and your journal'],
  ['plan', 'Planning & shopping', 'calendar-outline', 'Meal plan, shopping list, scanning food'],
  ['timers', 'Timers & alarms', 'timer-outline', 'Alarms, sounds and running several timers'],
  ['sous', AI_NAME, 'sparkles-outline', `What ${AI_NAME} knows and managing chats`],
  ['app', 'App & sharing', 'qr-code-outline', 'QR codes, colours and fonts'],
];

export default function HelpScreen() {
  const th = useTheme();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<Topic | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const items = FAQ.filter(f => (!topic || f.t === topic) && (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)));
  const shownTopics = TOPICS.filter(([t]) => items.some(f => f.t === t));

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <PageTitle>Help center</PageTitle>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 48, gap: 18 }} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={{ borderRadius: 28, padding: 20, gap: 14, backgroundColor: th.c.accent, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -70, right: -60, backgroundColor: '#FFFFFF', opacity: 0.08 }} />
          <View style={{ gap: 2 }}>
            <Txt kind="head" weight="bold" size={26} color={th.c.onAccent}>How can we help?</Txt>
            <Txt size={14} color={th.c.onAccent} style={{ opacity: 0.85 }}>Search, or pick a topic below.</Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 14, borderRadius: 24, backgroundColor: th.c.surface }}>
            <Icon name="search" size={18} color={th.c.muted} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Search help" placeholderTextColor={th.c.muted} maxLength={80}
              style={[{ flex: 1, minWidth: 0, color: th.c.text, fontSize: th.fs(16), paddingVertical: 0 }, th.f('body')]} />
            {query ? <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search"><Icon name="close-circle" size={18} color={th.c.muted} /></Pressable> : null}
          </View>
        </View>

        {/* Topics */}
        {!q ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
            {TOPICS.map(([t, name, icon]) => {
              const on = topic === t;
              const count = FAQ.filter(f => f.t === t).length;
              return (
                <Pressable key={t} onPress={() => { setTopic(on ? null : t); setOpen(null); }} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={({ pressed }) => ({ width: '48.4%', padding: 14, gap: 10, borderRadius: 22, backgroundColor: on ? th.c.accentSoft : th.c.surface, borderWidth: 1.5, borderColor: on ? th.c.accent : th.c.line, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                  <View style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? th.c.accent : th.c.accentSoft }}>
                    <Icon name={icon} size={20} color={on ? th.c.onAccent : th.c.accent} />
                  </View>
                  <View>
                    <Txt weight="black" size={15} numberOfLines={2}>{name}</Txt>
                    <Txt muted size={12}>{count} {count === 1 ? 'answer' : 'answers'}</Txt>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* Questions, grouped by topic */}
        {shownTopics.map(([t, name, icon, blurb]) => {
          const list = items.filter(f => f.t === t);
          return (
            <View key={t} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
                <Icon name={icon} size={18} color={th.c.accent} />
                <View style={{ flex: 1 }}>
                  <Txt weight="black" size={17}>{name}</Txt>
                  <Txt muted size={12}>{blurb}</Txt>
                </View>
              </View>
              <Card style={{ paddingHorizontal: 4 }}>
                {list.map((f, i) => {
                  const on = open === f.q || !!q;
                  return (
                    <Pressable key={f.q} onPress={() => setOpen(on && !q ? null : f.q)} accessibilityRole="button" accessibilityState={{ expanded: on }}
                      style={{ paddingHorizontal: 12, paddingVertical: 14, gap: 8, borderBottomWidth: i === list.length - 1 ? 0 : 1, borderBottomColor: th.c.line }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Txt weight="bold" style={{ flex: 1 }}>{f.q}</Txt>
                        <Icon name={on ? 'chevron-up' : 'chevron-down'} size={18} color={th.c.muted} />
                      </View>
                      {on ? <Txt muted size={15} style={{ lineHeight: 22 }}>{f.a}</Txt> : null}
                    </Pressable>
                  );
                })}
              </Card>
            </View>
          );
        })}
        {!items.length ? <Txt muted style={{ textAlign: 'center', padding: 16 }}>No answers match “{query.trim()}”.</Txt> : null}

        {/* Contact */}
        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
              <Icon name="chatbox-ellipses-outline" size={22} color={th.c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="black" size={16}>Still stuck?</Txt>
              <Txt muted size={13}>Tell us what happened and we’ll help.</Txt>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {([['bug-outline', 'Report an issue', '/feedback?mode=issue'], ['heart-outline', 'Send feedback', '/feedback']] as const).map(([icon, label, href]) => (
              <Pressable key={label} onPress={() => router.push(href)} style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, borderRadius: 23, backgroundColor: pressed ? th.c.line : th.c.soft })}>
                <Icon name={icon} size={17} />
                <Txt weight="bold" size={14}>{label}</Txt>
              </Pressable>
            ))}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
