// Sous settings: how the assistant should answer, your diet and allergies, and chat history.
// Saved now; Sous uses them once it is connected to the AI.
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Group, Segmented, Toggle } from '../components/settings-ui';
import { Btn, Card, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { AI_NAME, useChats } from '../lib/chat-store';
import { useCookLog } from '../lib/cook-log';
import { usePlanner } from '../lib/planner';
import { buildSousContext } from '../lib/sous-context';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';

const DIETS = ['Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-free', 'Dairy-free', 'Nut-free', 'Halal', 'Kosher'];

export default function SousSettings() {
  const th = useTheme();
  const { settings, updateSettings, recipes } = useApp();
  const { chats, deleteChats } = useChats();
  const plan = usePlanner().entries;
  const cooks = useCookLog().entries;
  const [showContext, setShowContext] = useState(false);
  const context = buildSousContext({ settings, recipes, plan, cooks });
  const diets = new Set(settings.aiDiet.split(',').filter(d => DIETS.includes(d)));

  const toggleDiet = (d: string) => {
    const next = new Set(diets);
    if (next.has(d)) next.delete(d);
    else next.add(d);
    updateSettings({ aiDiet: [...next].join(',') });
  };

  const clearChats = () =>
    Alert.alert('Delete all chats?', `All ${chats.length} chats and their voice messages will be deleted. This can’t be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: () => deleteChats(chats.map(c => c.id)) },
    ]);

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>{`${AI_NAME} settings`}</Txt>
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 60, gap: 28 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Card style={{ padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Icon name="information-circle-outline" size={22} color={th.c.accent} />
          <Txt muted size={14} style={{ flex: 1 }}>{`${AI_NAME} isn’t connected yet. Your choices are saved and will shape its answers once it is.`}</Txt>
        </Card>

        <Group title="Answers">
          <Segmented label="Length" k="aiStyle" options={[['short', 'Short & simple'], ['detailed', 'Detailed']]} />
          <Segmented label="Units" k="aiUnits" options={[['metric', 'Metric'], ['us', 'US'], ['both', 'Both']]} />
          <Segmented label="Cooking level" k="aiSkill" options={[['beginner', 'Beginner'], ['home', 'Home cook'], ['confident', 'Confident']]} />
        </Group>

        <Group title="Diet">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DIETS.map(d => {
              const on = diets.has(d);
              return (
                <Pressable key={d} onPress={() => toggleDiet(d)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: on ? th.c.accent : th.c.soft }}>
                  {on ? <Icon name="checkmark" size={15} color={th.c.onAccent} /> : null}
                  <Txt weight="bold" size={14} color={on ? th.c.onAccent : th.c.text}>{d}</Txt>
                </Pressable>
              );
            })}
          </View>
          <View style={{ gap: 8 }}>
            <Txt weight="black" size={14}>Allergies and foods you don’t like</Txt>
            <TextInput
              value={settings.aiNotes}
              onChangeText={aiNotes => updateSettings({ aiNotes })}
              placeholder="e.g. allergic to shellfish, no coriander"
              placeholderTextColor={th.c.muted}
              multiline
              maxLength={300}
              textAlignVertical="top"
              style={[{ minHeight: 90, padding: 14, borderRadius: th.radius, borderWidth: 1.5, borderColor: th.c.line, backgroundColor: th.c.surface, color: th.c.text, fontSize: th.fs(15) }, th.f('body')]}
            />
          </View>
        </Group>

        <Group title="Behaviour">
          <Card style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
            <Toggle k="aiUseRecipes" label="Use my saved recipes" />
            <Toggle k="aiUsePlan" label="Use my meal plan" />
            <Toggle k="aiUseJournal" label="Use my cooking journal" hint="Your stars and notes, so it remembers what you liked" />
            <Toggle k="aiVoiceReplies" label="Read answers out loud in voice mode" last />
          </Card>
          <Pressable onPress={() => setShowContext(v => !v)} accessibilityRole="button" accessibilityState={{ expanded: showContext }}>
            <Card style={{ padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="eye-outline" size={20} color={th.c.accent} />
                <Txt weight="bold" style={{ flex: 1 }}>{`What ${AI_NAME} knows about you`}</Txt>
                <Icon name={showContext ? 'chevron-up' : 'chevron-down'} size={18} color={th.c.muted} />
              </View>
              {showContext ? (
                <View style={{ gap: 8 }}>
                  <Txt muted size={13}>{`Sent along with your messages, word for word. Turn things off above to leave them out.`}</Txt>
                  {context.map(line => (
                    <View key={line} style={{ flexDirection: 'row', gap: 8 }}>
                      <Txt muted size={14}>•</Txt>
                      <Txt size={14} style={{ flex: 1 }}>{line}</Txt>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          </Pressable>
        </Group>

        <Group title="Chat history">
          <Btn title={chats.length ? `Delete all chats (${chats.length})` : 'No chats yet'} icon="trash-outline" variant="ghost" disabled={!chats.length} onPress={clearChats} style={{ alignSelf: 'flex-start' }} />
        </Group>
      </ScrollView>
    </Screen>
  );
}
