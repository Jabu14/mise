// Edit a saved recipe: its photo, name, description, how much it makes, ingredients, steps and
// notes. This is a direct editor (no pasting or prompts) — the point is tidying a recipe you already
// have. Timers in steps are picked up from the step text (e.g. "bake 40 minutes").
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActionSheetIOS, Alert, Image, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Btn, Card, Dock, Icon, IconBtn, Label, PageTitle, Screen, TopBar, Txt, type IconName } from '../../components/ui';
import { keepPhoto } from '../../lib/cook-log';
import { useApp, type Group, type Step } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { findTimers, plainText } from '../../shared/parser';

type EStep = { title: string; text: string };

export default function EditRecipe() {
  const th = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRecipe, patchRecipe, settings } = useApp();
  const r = getRecipe(id);

  const [title, setTitle] = useState(r?.title ?? '');
  const [description, setDescription] = useState(r ? plainText(r.description) : '');
  const [makes, setMakes] = useState(r?.servings?.label ?? '');
  const [photo, setPhoto] = useState(r?.photo);
  const [groups, setGroups] = useState<Group[]>(() => (r?.ingredients.length ? r.ingredients.map(g => ({ name: g.name, items: [...g.items] })) : [{ name: '', items: [''] }]));
  const [steps, setSteps] = useState<EStep[]>(() => (r?.steps.length ? r.steps.map(s => ({ title: s.title, text: plainText(s.text) })) : [{ title: '', text: '' }]));
  const [notes, setNotes] = useState<string[]>(() => r?.notes.length ? [...r.notes] : []);
  const [dockH, setDockH] = useState(0);
  const tick = () => { if (settings.haptics) Haptics.selectionAsync().catch(() => {}); };

  if (!r) return <Screen><TopBar sheet><IconBtn name="close" label="Close" onPress={() => router.back()} /><PageTitle>Edit recipe</PageTitle></TopBar></Screen>;

  const changePhoto = async () => {
    const choose = async (camera: boolean) => {
      const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const res = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [4, 3] })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [4, 3] });
      const uri = !res.canceled ? res.assets?.[0]?.uri : null;
      if (uri) setPhoto(await keepPhoto(uri, `recipe-${r.id}`).catch(() => uri));
    };
    // Native menu here: this screen is a modal, so a custom sheet would open behind it.
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: 'Recipe photo', options: photo ? ['Take photo', 'Choose from library', 'Remove photo', 'Cancel'] : ['Take photo', 'Choose from library', 'Cancel'], cancelButtonIndex: photo ? 3 : 2, destructiveButtonIndex: photo ? 2 : undefined },
        i => { if (i === 0) choose(true); else if (i === 1) choose(false); else if (photo && i === 2) setPhoto(undefined); },
      );
    } else {
      Alert.alert('Recipe photo', undefined, [
        { text: 'Take photo', onPress: () => choose(true) },
        { text: 'Choose from library', onPress: () => choose(false) },
        ...(photo ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => setPhoto(undefined) }] : []),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  // ---- ingredient helpers ----
  const setItem = (gi: number, ii: number, v: string) => setGroups(gs => gs.map((g, i) => (i === gi ? { ...g, items: g.items.map((it, j) => (j === ii ? v : it)) } : g)));
  const addItem = (gi: number) => { tick(); setGroups(gs => gs.map((g, i) => (i === gi ? { ...g, items: [...g.items, ''] } : g))); };
  const removeItem = (gi: number, ii: number) => setGroups(gs => gs.map((g, i) => (i === gi ? { ...g, items: g.items.filter((_, j) => j !== ii) } : g)).filter(g => g.items.length || g.name));
  const setGroupName = (gi: number, v: string) => setGroups(gs => gs.map((g, i) => (i === gi ? { ...g, name: v } : g)));
  const addGroup = () => { tick(); setGroups(gs => [...gs, { name: '', items: [''] }]); };

  // ---- step helpers ----
  const setStep = (i: number, patch: Partial<EStep>) => setSteps(ss => ss.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const addStep = () => { tick(); setSteps(ss => [...ss, { title: '', text: '' }]); };
  const removeStep = (i: number) => setSteps(ss => ss.filter((_, j) => j !== i));
  const moveStep = (i: number, d: number) => { tick(); setSteps(ss => { const n = [...ss]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; }); };

  // ---- notes ----
  const setNote = (i: number, v: string) => setNotes(ns => ns.map((n, j) => (j === i ? v : n)));
  const addNote = () => { tick(); setNotes(ns => [...ns, '']); };
  const removeNote = (i: number) => setNotes(ns => ns.filter((_, j) => j !== i));

  const validSteps = steps.filter(s => s.title.trim() || s.text.trim());
  const canSave = title.trim().length > 0 && validSteps.length > 0;

  const save = () => {
    if (!canSave) return;
    if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const ingredients: Group[] = groups
      .map(g => ({ name: g.name.trim().slice(0, 60), items: g.items.map(it => it.trim()).filter(Boolean).slice(0, 60) }))
      .filter(g => g.items.length);
    // Keep each step's phase and tip by position; recompute timers from the (possibly edited) text.
    const outSteps: Step[] = validSteps.map((s, i) => {
      const prev = r.steps[i];
      const text = s.text.trim();
      return { title: s.title.trim().slice(0, 120), text: text.slice(0, 4000), tip: prev?.tip ?? '', phase: prev?.phase ?? '', timers: findTimers(text).slice(0, 3) };
    });
    const count = r.servings?.count ?? null;
    const label = makes.trim().slice(0, 60);
    patchRecipe(r.id, {
      title: title.trim().slice(0, 120),
      description: description.trim().slice(0, 500),
      servings: label ? { count, label } : r.servings,
      ingredients,
      steps: outSteps,
      notes: notes.map(n => n.trim()).filter(Boolean).slice(0, 20),
      photo,
      updatedAt: Date.now(),
    });
    router.back();
  };

  const input = (props: React.ComponentProps<typeof TextInput>) => (
    <TextInput placeholderTextColor={th.c.muted} {...props}
      style={[{ color: th.c.text, fontSize: th.fs(16), paddingVertical: 8, paddingHorizontal: 2, borderBottomWidth: 1.5, borderColor: th.c.line }, th.f('body'), props.style as object]} />
  );

  return (
    <Screen>
      <TopBar sheet>
        <IconBtn name="close" label="Close" onPress={() => router.back()} />
        <PageTitle>Edit recipe</PageTitle>
        <Pressable onPress={save} disabled={!canSave} accessibilityRole="button" accessibilityLabel="Save"
          style={({ pressed }) => ({ height: 40, paddingHorizontal: 18, borderRadius: 20, marginRight: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: canSave ? th.c.accent : th.c.soft, opacity: pressed ? 0.8 : 1 })}>
          <Txt weight="black" size={15} color={canSave ? th.c.onAccent : th.c.muted}>Save</Txt>
        </Pressable>
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: dockH + 24, gap: 22 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        {/* Photo */}
        <Pressable onPress={changePhoto} accessibilityRole="button" accessibilityLabel="Change recipe photo"
          style={{ height: 160, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: th.c.soft, borderWidth: photo ? 0 : 1.5, borderColor: th.c.line, borderStyle: photo ? 'solid' : 'dashed' }}>
          {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: 160 }} resizeMode="cover" /> : (
            <>
              <Icon name="camera-outline" size={28} color={th.c.accent} />
              <Txt weight="bold" color={th.c.accent}>Add a photo</Txt>
            </>
          )}
          {photo ? (
            <View style={{ position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.55)' }}>
              <Icon name="camera-outline" size={16} color="#fff" />
              <Txt weight="bold" size={13} color="#fff">Change</Txt>
            </View>
          ) : null}
        </Pressable>

        {/* Basics */}
        <View style={{ gap: 16 }}>
          <Field label="Name">{input({ value: title, onChangeText: setTitle, placeholder: 'Recipe name', maxLength: 120 })}</Field>
          <Field label="Description">{input({ value: description, onChangeText: setDescription, placeholder: 'A line about the dish', maxLength: 500, multiline: true })}</Field>
          <Field label="Makes">{input({ value: makes, onChangeText: setMakes, placeholder: 'e.g. 1 loaf, 4 servings', maxLength: 60 })}</Field>
        </View>

        {/* Ingredients */}
        <View style={{ gap: 12 }}>
          <Txt kind="head" weight="bold" size={21}>Ingredients</Txt>
          {groups.map((g, gi) => (
            <Card key={gi} style={{ padding: 14, gap: 10 }}>
              {(groups.length > 1 || g.name) ? (
                input({ value: g.name, onChangeText: v => setGroupName(gi, v), placeholder: 'Group name (optional), e.g. Dough', maxLength: 60, style: { fontWeight: '800' } }) as React.ReactNode
              ) : null}
              {g.items.map((it, ii) => (
                <View key={ii} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}>{input({ value: it, onChangeText: v => setItem(gi, ii, v), placeholder: 'e.g. 500 g bread flour', maxLength: 160 })}</View>
                  <RoundBtn icon="close" label="Remove ingredient" onPress={() => removeItem(gi, ii)} />
                </View>
              ))}
              <Pressable onPress={() => addItem(gi)} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 }}>
                <Icon name="add" size={18} color={th.c.accent} />
                <Txt weight="bold" size={14} color={th.c.accent}>Add ingredient</Txt>
              </Pressable>
            </Card>
          ))}
          <Pressable onPress={addGroup} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
            <Icon name="add-circle-outline" size={18} color={th.c.accent} />
            <Txt weight="bold" size={14} color={th.c.accent}>Add a group</Txt>
          </Pressable>
        </View>

        {/* Steps */}
        <View style={{ gap: 12 }}>
          <Txt kind="head" weight="bold" size={21}>Steps</Txt>
          {steps.map((s, i) => (
            <Card key={i} style={{ padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
                  <Txt weight="black" size={14} color={th.c.accent}>{i + 1}</Txt>
                </View>
                <View style={{ flex: 1 }}>{input({ value: s.title, onChangeText: v => setStep(i, { title: v }), placeholder: 'Step title (optional)', maxLength: 120, style: { fontWeight: '800' } })}</View>
                <RoundBtn icon="chevron-up" label="Move up" onPress={() => moveStep(i, -1)} disabled={i === 0} />
                <RoundBtn icon="chevron-down" label="Move down" onPress={() => moveStep(i, 1)} disabled={i === steps.length - 1} />
                <RoundBtn icon="trash-outline" label="Remove step" onPress={() => removeStep(i)} disabled={steps.length === 1} />
              </View>
              {input({ value: s.text, onChangeText: v => setStep(i, { text: v }), placeholder: 'What to do in this step…', maxLength: 4000, multiline: true, style: { minHeight: 48 } })}
              {findTimers(s.text).length ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="timer-outline" size={14} color={th.c.accent} />
                  <Txt muted size={13}>Timer found: {findTimers(s.text).map(t => t.label).join(', ')}</Txt>
                </View>
              ) : null}
            </Card>
          ))}
          <Pressable onPress={addStep} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
            <Icon name="add-circle-outline" size={18} color={th.c.accent} />
            <Txt weight="bold" size={14} color={th.c.accent}>Add a step</Txt>
          </Pressable>
        </View>

        {/* Notes */}
        <View style={{ gap: 12 }}>
          <Txt kind="head" weight="bold" size={21}>Notes & tips</Txt>
          {notes.map((n, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>{input({ value: n, onChangeText: v => setNote(i, v), placeholder: 'A tip or note', maxLength: 500, multiline: true })}</View>
              <RoundBtn icon="close" label="Remove note" onPress={() => removeNote(i)} />
            </View>
          ))}
          <Pressable onPress={addNote} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
            <Icon name="add" size={18} color={th.c.accent} />
            <Txt weight="bold" size={14} color={th.c.accent}>Add a note</Txt>
          </Pressable>
        </View>

        <Txt muted size={12} style={{ textAlign: 'center' }}>Tip: write times like “bake 40 minutes” in a step and Mise adds the timer for you.</Txt>
      </ScrollView>

      <Dock onHeight={setDockH}>
        <Btn title="Save changes" icon="checkmark" size="big" grow disabled={!canSave} onPress={save} />
      </Dock>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <Label>{label}</Label>
      {children}
    </View>
  );
}

function RoundBtn({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} hitSlop={4}
      style={({ pressed }) => ({ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? th.c.line : th.c.soft, opacity: disabled ? 0.35 : 1 })}>
      <Icon name={icon} size={16} color={th.c.text} />
    </Pressable>
  );
}
