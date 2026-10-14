// Cook mode: one big step at a time (swipe between them) or all steps in a list.
// Hands-free (the mic button): every step is read out loud, and claps move you along:
// two claps = next step, three claps = start the step's timer (or hear the step again).
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepScene } from '../../components/art/step-scenes';
import { IngredientList, ingCountText, servingsLabel } from '../../components/recipe';
import { Btn, Card, Chip, Dock, Icon, IconBtn, Label, Screen, StepBody, TopBar, Txt, clock } from '../../components/ui';
import { formatDuration, ingredientsUsedIn, scaleText } from '../../shared/parser';
import { say, speakStep, stopSpeaking, useClapCommands } from '../../lib/hands-free';
import { useApp, useTimers, type Recipe } from '../../lib/store';
import { useTheme } from '../../lib/theme';

function KeepAwake() {
  useKeepAwake();
  return null;
}

export default function Cook() {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id, step } = useLocalSearchParams<{ id: string; step?: string }>();
  const { getRecipe, setProgress, markCooked, settings, updateSettings } = useApp();
  const { timers, startTimer } = useTimers();
  const r = getRecipe(id);
  const total = r?.steps.length ?? 0;
  const [index, setIndex] = useState(() => Math.min(Math.max(parseInt(step || '0', 10) || 0, 0), Math.max(total - 1, 0)));
  const [finished, setFinished] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [dockH, setDockH] = useState(0);
  const pager = useRef<FlatList>(null);
  const list = useRef<ScrollView>(null);
  const positions = useRef<number[]>([]);
  const listLayout = settings.cookLayout === 'list';

  useEffect(() => {
    if (r) setProgress(r.id, { step: finished ? total : index });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, finished]);

  useEffect(() => {
    if (listLayout && positions.current[index] != null) list.current?.scrollTo({ y: Math.max(0, positions.current[index] - 24), animated: true });
  }, [index, listLayout]);

  const goTo = (i: number) => {
    if (!r || i < 0) return;
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    if (i >= total) {
      setFinished(true);
      markCooked(r.id);
      if (settings.handsFree) say(`All done! Enjoy your ${r.title}.`, settings);
      return;
    }
    setIndex(i);
    if (!listLayout) pager.current?.scrollToIndex({ index: i, animated: true });
  };

  // ---- hands-free ----
  const handsFree = settings.handsFree && !finished && !!r;
  const [speaking, setSpeaking] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const voice = { onStart: () => setSpeaking(true), onDone: () => setSpeaking(false) };
  const show = (text: string) => { setHeard(text); setTimeout(() => setHeard(null), 1600); };
  const readStep = () => { if (r) speakStep(r.steps[index], index + 1, total, settings, voice); };

  // Starts the first of this step's timers that isn't already running.
  const startStepTimer = () => {
    if (!r) return false;
    const s = r.steps[index];
    const ti = s.timers.findIndex((_, k) => !timers.some(x => x.key === `${r.id}:${index}:${k}`));
    if (ti < 0) return false;
    const t = s.timers[ti];
    startTimer({ key: `${r.id}:${index}:${ti}`, minutes: t.minutes, label: (!t.auto && t.label) || s.title || t.label || `Step ${index + 1}`, recipeId: r.id, recipeTitle: r.title });
    say(`${formatDuration(t.minutes)} timer started.`, settings, voice);
    return true;
  };

  const listening = useClapCommands({
    enabled: handsFree,
    quiet: speaking,
    onClaps: count => {
      if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (count === 2) {
        show(index === total - 1 ? '👏👏  Finished!' : '👏👏  Next step');
        goTo(index + 1);
      } else if (startStepTimer()) {
        show('👏👏👏  Timer started');
      } else {
        show('👏👏👏  Reading it again');
        readStep();
      }
    },
  });

  // Read each step out loud as you reach it (and stop talking when you leave or turn it off).
  useEffect(() => {
    if (!handsFree || !r) return;
    speakStep(r.steps[index], index + 1, total, settings, voice);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handsFree, index]);

  if (!r) return <Screen><TopBar><IconBtn name="close" label="Close" onPress={() => router.back()} /></TopBar></Screen>;

  if (finished) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <Txt size={80} style={{ lineHeight: 100 }}>🎉</Txt>
          <Txt kind="head" weight="bold" size={38}>All done!</Txt>
          <Txt muted style={{ textAlign: 'center' }}>Enjoy your {r.title}. {r.emoji}</Txt>
          <View style={{ gap: 10, width: '100%', maxWidth: 320, marginTop: 12 }}>
            <Btn title="Back to recipe" size="big" onPress={() => router.back()} />
            <Btn title="Cook it again" icon="refresh" variant="secondary" onPress={() => { setFinished(false); setIndex(0); }} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {settings.keepAwake && <KeepAwake />}
      <TopBar>
        <IconBtn name="close" label="Leave cook mode" onPress={() => router.back()} />
        <Txt weight="bold" muted style={{ flex: 1, textAlign: 'center' }}>
          <Txt weight="black">Step {index + 1}</Txt> of {total}
        </Txt>
        <IconBtn name={settings.handsFree ? 'mic' : 'mic-outline'} label={settings.handsFree ? 'Turn off hands-free' : 'Turn on hands-free'} tinted={settings.handsFree} onPress={() => updateSettings({ handsFree: !settings.handsFree })} />
        <IconBtn name="list" label="Show ingredients" onPress={() => setSheet(true)} />
      </TopBar>
      <View style={{ height: 6, marginHorizontal: 16, borderRadius: 999, backgroundColor: th.c.soft, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${((index + 1) / total) * 100}%`, borderRadius: 999, backgroundColor: th.c.accent }} />
      </View>
      {handsFree ? (
        <View style={{ marginHorizontal: 16, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, paddingRight: 6, paddingVertical: 8, borderRadius: 18, backgroundColor: th.c.accentSoft }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: listening === 'listening' && !speaking ? th.c.accent : th.c.muted }} />
          <View style={{ flex: 1 }}>
            <Txt weight="black" size={14} color={th.c.accent}>
              {heard ?? (listening === 'no-mic' ? 'Reading aloud (mic is off)' : speaking ? 'Reading the step…' : listening === 'listening' ? 'Listening for claps' : 'Getting ready…')}
            </Txt>
            <Txt size={12} muted>{listening === 'no-mic' ? 'Allow the microphone for Mise in Settings to use claps.' : '👏👏 next step  ·  👏👏👏 timer or repeat'}</Txt>
          </View>
          <IconBtn name="volume-high-outline" label="Read this step again" size={38} onPress={readStep} />
        </View>
      ) : null}

      {listLayout ? (
        <ScrollView ref={list} contentContainerStyle={{ padding: 16, paddingBottom: dockH + 300, gap: 14 }}>
          {r.steps.map((_, k) => (
            <View key={k} onLayout={e => { positions.current[k] = e.nativeEvent.layout.y; }} style={{ opacity: k === index ? 1 : k < index ? 0.42 : 0.6 }}>
              <Card style={[{ padding: 18, gap: 14 }, k === index && { borderColor: th.c.accent, borderWidth: 2 }]}>
                <CookStep recipe={r} index={k} compact />
                {k === index ? (
                  <Btn title={k === total - 1 ? 'Finish' : 'Done, next'} iconRight="checkmark" onPress={() => goTo(k + 1)} style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Btn title={k < index ? 'Go back to this step' : 'Jump to this step'} variant="ghost" size="small" onPress={() => goTo(k)} style={{ alignSelf: 'flex-start' }} />
                )}
              </Card>
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          ref={pager}
          data={r.steps}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={e => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            if (i !== index) {
              setIndex(i);
              if (settings.haptics) Haptics.selectionAsync().catch(() => {});
            }
          }}
          extraData={index}
          renderItem={({ index: i }) => (
            <ScrollView style={{ width }} contentContainerStyle={{ padding: 20, paddingTop: settings.stepArt ? 16 : 28, paddingBottom: dockH + 28, gap: 18 }}>
              {settings.stepArt ? (
                <View style={{ alignItems: 'center', borderRadius: 28, backgroundColor: th.c.soft, paddingVertical: 6 }}>
                  <StepScene step={r.steps[i]} index={i} width={Math.min(width - 56, 340)} active={i === index} />
                </View>
              ) : null}
              <CookStep recipe={r} index={i} />
            </ScrollView>
          )}
        />
      )}

      <Dock onHeight={setDockH}>
        {!listLayout && (
          <>
            <Btn variant="secondary" size="big" icon="arrow-back" disabled={index === 0} onPress={() => goTo(index - 1)} accessibilityLabel="Previous step" />
            <Btn grow size="big" title={index === total - 1 ? 'Finish' : 'Next step'} iconRight={index === total - 1 ? 'checkmark' : 'arrow-forward'} onPress={() => goTo(index + 1)} />
          </>
        )}
      </Dock>

      <Modal visible={sheet} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSheet(false)}>
        <View style={{ flex: 1, backgroundColor: th.c.surface }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingLeft: 20, paddingRight: 8, paddingBottom: 4 }}>
            <View style={{ flex: 1 }}>
              <Txt kind="head" weight="bold" size={22}>Ingredients</Txt>
              <Txt muted size={14}>{servingsLabel(r)} · {ingCountText(r)}</Txt>
            </View>
            <IconBtn name="close" label="Close" onPress={() => setSheet(false)} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 8, paddingBottom: insets.bottom + 24 }}>
            <IngredientList recipe={r} />
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

function CookStep({ recipe: r, index: i, compact }: { recipe: Recipe; index: number; compact?: boolean }) {
  const th = useTheme();
  const { settings } = useApp();
  const s = r.steps[i];
  const scale = r.progress.scale || 1;
  const used: string[] = settings.stepIngredients ? ingredientsUsedIn(r, s) : [];
  return (
    <StepBody step={s} number={i + 1} compact={compact} text={scale !== 1 ? scaleText(s.text, scale, { unitsOnly: true }) : s.text}>
      {s.timers.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {s.timers.map((t, ti) => <TimerChip key={ti} recipe={r} stepIndex={i} timerIndex={ti} />)}
        </View>
      ) : null}
      {used.length ? (
        <View style={{ gap: 8 }}>
          <Label color={th.c.muted}>{"You'll need"}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {used.map(u => <Chip key={u} outlined>{scaleText(u, scale).replace(/\*\*/g, '')}</Chip>)}
          </View>
        </View>
      ) : null}
    </StepBody>
  );
}

function TimerChip({ recipe: r, stepIndex, timerIndex }: { recipe: Recipe; stepIndex: number; timerIndex: number }) {
  const th = useTheme();
  const { timers, remaining, startTimer, togglePause, removeTimer } = useTimers();
  const t = r.steps[stepIndex].timers[timerIndex];
  const key = `${r.id}:${stepIndex}:${timerIndex}`;
  const running = timers.find(x => x.key === key);
  const style = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 };

  if (running) {
    const paused = running.pausedLeft != null;
    return (
      <Pressable onPress={() => (running.done ? removeTimer(running.id) : togglePause(running.id))} style={[style, { backgroundColor: th.c.accent }]}>
        <Icon name={running.done ? 'checkmark' : paused ? 'play' : 'pause'} size={20} color={th.c.onAccent} />
        <Txt weight="black" size={18} color={th.c.onAccent} style={{ fontVariant: ['tabular-nums'] }}>
          {running.done ? "Time's up!" : clock(remaining(running))}
        </Txt>
        <Txt weight="bold" size={14} color={th.c.onAccent} style={{ opacity: 0.8 }}>
          {running.done ? 'Tap to stop' : paused ? 'Paused' : t.label}
        </Txt>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={() => {
        if (th.settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        startTimer({ key, minutes: t.minutes, label: (!t.auto && t.label) || r.steps[stepIndex].title || t.label || `Step ${stepIndex + 1}`, recipeId: r.id, recipeTitle: r.title });
      }}
      style={({ pressed }) => [style, { backgroundColor: th.c.accentSoft, borderWidth: 1.5, borderStyle: 'dashed', borderColor: th.c.accent + '70', transform: [{ scale: pressed ? 0.97 : 1 }] }]}
    >
      <Icon name="timer-outline" size={20} color={th.c.accent} />
      <Txt weight="black" size={17} color={th.c.accent}>Start {formatDuration(t.minutes)}</Txt>
      {t.label ? <Txt weight="bold" size={14} color={th.c.accent} style={{ opacity: 0.8 }}>{t.label}</Txt> : null}
    </Pressable>
  );
}

