// Add or edit a recipe: copy the Mise Prompt, paste the answer, preview, save.
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { AiImportCard } from './ai-import';
import { Btn, Card, Dock, IconBtn, Label, Screen, TopBar, Txt, PageTitle } from './ui';
import { RECIPE_PROMPT } from '../shared/content';
import { parseRecipe, plainText, guessEmoji } from '../shared/parser';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';
import { showAlert } from './sheet';

// Used by the Add tab (no id) and the Edit screen (with the recipe's id).
export function Editor({ existingId }: { existingId?: string }) {
  const th = useTheme();
  const { getRecipe, saveParsed, settings } = useApp();
  const existing = getRecipe(existingId);
  const [source, setSource] = useState(existing?.source || '');
  const [debounced, setDebounced] = useState(source);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dockH, setDockH] = useState(0);
  const prompt = settings.recipePrompt || RECIPE_PROMPT;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(source), 250);
    return () => clearTimeout(t);
  }, [source]);

  const draft = useMemo(() => (debounced.trim() ? parseRecipe(debounced) : null), [debounced]);
  const ingCount = draft?.ingredients.reduce((n: number, g: { items: string[] }) => n + g.items.length, 0) ?? 0;
  const timerCount = draft?.steps.reduce((n: number, s: { timers: unknown[] }) => n + s.timers.length, 0) ?? 0;

  const copyPrompt = async () => {
    await Clipboard.setStringAsync(prompt);
    showAlert('Prompt copied', 'Paste it into your AI chat, right after the recipe.');
  };

  const paste = async () => {
    const text = await Clipboard.getStringAsync();
    if (!text) return showAlert('Clipboard is empty', "Copy the recipe or the AI's answer first.");
    setSource(text);
    setDebounced(text);
  };

  const save = () => {
    const parsed = parseRecipe(source);
    if (!parsed?.steps.length) return;
    const newId = saveParsed(parsed, source, existing?.id);
    if (existing) return router.back();
    setSource('');
    setDebounced('');
    router.push(`/recipe/${newId}`);
  };

  return (
    <Screen>
      <TopBar>
        {existing ? (
          <>
            <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
            <PageTitle>Edit recipe</PageTitle>
          </>
        ) : (
          <Txt kind="head" weight="bold" size={30} style={{ flex: 1, paddingLeft: 8 }}>Add a recipe</Txt>
        )}
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: dockH + 24, gap: 16 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        {!existing && (
          <>
            <AiImportCard pastedText={source} onResult={text => { setSource(text); setDebounced(text); }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: th.c.line }} />
              <Txt muted size={13} weight="bold">or paste it yourself</Txt>
              <View style={{ flex: 1, height: 1, backgroundColor: th.c.line }} />
            </View>
          </>
        )}
        <Card style={{ padding: 18, gap: 14 }}>
          <HowStep n={1} title="Get the recipe in app format" text="Copy this prompt and send it to your AI assistant in the same chat as your recipe." />
          <Btn title="Copy the Mise Prompt" icon="copy-outline" variant="secondary" onPress={copyPrompt} />
          <Pressable onPress={() => setShowPrompt(v => !v)} hitSlop={8}>
            <Txt weight="bold" size={14} color={th.c.accent}>{showPrompt ? '▾ Hide the prompt' : '▸ See the prompt'}</Txt>
          </Pressable>
          {showPrompt && (
            <View style={{ backgroundColor: th.c.soft, borderRadius: th.radiusSm, padding: 12 }}>
              <Txt size={12} selectable style={{ fontFamily: 'monospace' }}>{prompt}</Txt>
            </View>
          )}
          <HowStep n={2} title="Paste the answer below" text="Any recipe text works too. Mise will do its best to read it." />
        </Card>

        <TextInput
          value={source}
          onChangeText={setSource}
          multiline
          placeholder="Paste the recipe here…"
          placeholderTextColor={th.c.muted}
          textAlignVertical="top"
          autoCorrect={false}
          maxLength={100000}
          style={[{ minHeight: 220, maxHeight: 360, padding: 16, borderRadius: th.radius, borderWidth: 1.5, borderColor: th.c.line, backgroundColor: th.c.surface, color: th.c.text, fontSize: th.fs(15) }, th.f('body')]}
        />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: -6 }}>
          <Btn title="Paste" icon="clipboard-outline" variant="secondary" onPress={paste} />
          <Btn title="Clear" variant="ghost" onPress={() => { setSource(''); setDebounced(''); }} />
        </View>

        {draft && (
          <Card style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: th.c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={30} style={{ lineHeight: 40 }}>{guessEmoji(draft)}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Label>Preview</Label>
                <Txt kind="head" weight="bold" size={19}>{draft.title}</Txt>
                <Txt muted size={14}>{ingCount} ingredients · {draft.steps.length} steps{timerCount ? ` · ${timerCount} timers` : ''}</Txt>
              </View>
            </View>
            {draft.warnings.map((w: string) => (
              <View key={w} style={{ backgroundColor: th.c.tipBg, borderRadius: th.radiusSm, padding: 10 }}><Txt size={14}>{w}</Txt></View>
            ))}
            {draft.steps.slice(0, 4).map((s: { title: string; text: string }, i: number) => (
              <Txt key={i} muted size={14} numberOfLines={1}>{i + 1}. {s.title || plainText(s.text)}</Txt>
            ))}
            {draft.steps.length > 4 && <Txt muted size={14}>…and {draft.steps.length - 4} more</Txt>}
          </Card>
        )}
      </ScrollView>

      <Dock onHeight={setDockH}>
        <Btn title="Save recipe" icon="checkmark" size="big" grow disabled={!draft?.steps.length} onPress={save} />
      </Dock>
    </Screen>
  );
}

function HowStep({ n, title, text }: { n: number; title: string; text: string }) {
  const th = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: th.c.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Txt weight="black" size={14} color={th.c.onAccent}>{n}</Txt>
      </View>
      <View style={{ flex: 1 }}>
        <Txt weight="black" size={16}>{title}</Txt>
        <Txt muted size={14}>{text}</Txt>
      </View>
    </View>
  );
}
