// Mise Prompt: the instruction you paste into any AI chat so it answers with a recipe Mise reads
// perfectly. What it's for, how to use it, and the prompt itself (copy or edit it).
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Btn, Card, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { RECIPE_PROMPT } from '../shared/content';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';

const STEPS = [
  'Copy the prompt below.',
  'In any AI chat (ChatGPT, Gemini, Claude…), ask for a recipe, then paste the prompt right after.',
  'Copy the AI’s answer and paste it into Add recipe. Mise turns it into big, simple steps with timers.',
];

export default function RecipePromptScreen() {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const prompt = settings.recipePrompt || RECIPE_PROMPT;
  const custom = !!settings.recipePrompt;

  const copy = async () => {
    await Clipboard.setStringAsync(prompt);
    if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Mise Prompt</Txt>
        <IconBtn name={editing ? 'checkmark' : 'create-outline'} label={editing ? 'Done editing' : 'Edit prompt'} tinted={editing} onPress={() => setEditing(e => !e)} />
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 18 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={{ gap: 12 }}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
                <Txt weight="black" size={14} color={th.c.onAccent}>{i + 1}</Txt>
              </View>
              <Txt size={15} style={{ flex: 1, paddingTop: 3 }}>{s}</Txt>
            </View>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Txt weight="black" size={14} style={{ flex: 1 }}>{custom ? 'Your prompt (edited)' : 'The prompt'}</Txt>
            <Txt muted size={12}>{prompt.length.toLocaleString()} characters</Txt>
          </View>
          {editing ? (
            <TextInput
              multiline
              autoFocus
              value={prompt}
              onChangeText={text => updateSettings({ recipePrompt: text.trim() === RECIPE_PROMPT.trim() ? '' : text })}
              maxLength={8000}
              textAlignVertical="top"
              style={{ minHeight: 320, padding: 14, borderRadius: th.radius, borderWidth: 1.5, borderColor: th.c.accent, backgroundColor: th.c.surface, color: th.c.text, fontSize: 13, lineHeight: 19, fontFamily: 'monospace' }}
            />
          ) : (
            <Card style={{ padding: 14 }}>
              <Txt selectable size={13} style={{ fontFamily: 'monospace', lineHeight: 19 }}>{prompt}</Txt>
            </Card>
          )}
        </View>

        <Btn title={copied ? 'Copied!' : 'Copy prompt'} icon={copied ? 'checkmark' : 'copy-outline'} onPress={copy} />
        {custom ? <Btn title="Restore the original" icon="refresh" variant="ghost" size="small" onPress={() => updateSettings({ recipePrompt: '' })} style={{ alignSelf: 'center' }} /> : null}
      </ScrollView>
    </Screen>
  );
}
