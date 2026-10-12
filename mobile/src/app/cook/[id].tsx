// Cook mode: one big step at a time (swipe between them) or all steps in a list.
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IngredientList, ingCountText, servingsLabel } from '../../components/recipe';
import { Btn, Card, Chip, Dock, Icon, IconBtn, Label, Screen, StepBody, TopBar, Txt, clock } from '../../components/ui';
import { formatDuration, ingredientsUsedIn, scaleText } from '../../shared/parser';
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
  const { getRecipe, setProgress, markCooked, settings } = useApp();
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

  if (!r) return <Screen><TopBar><IconBtn name="close" label="Close" onPress={() => router.back()} /></TopBar></Screen>;

  const goTo = (i: number) => {
    if (i < 0) return;
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    if (i >= total) {
      setFinished(true);
      markCooked(r.id);
      return;
    }
    setIndex(i);
    if (!listLayout) pager.current?.scrollToIndex({ index: i, animated: true });
  };

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
        <IconBtn name="list" label="Show ingredients" onPress={() => setSheet(true)} />
      </TopBar>
      <View style={{ height: 6, marginHorizontal: 16, borderRadius: 999, backgroundColor: th.c.soft, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${((index + 1) / total) * 100}%`, borderRadius: 999, backgroundColor: th.c.accent }} />
      </View>

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
          renderItem={({ index: i }) => (
            <ScrollView style={{ width }} contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: dockH + 28 }}>
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

