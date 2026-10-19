// Recipe overview: servings, ingredient checklist, steps, notes.
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, View } from 'react-native';
// ScrollView is Animated.ScrollView, for the stretchy pull-to-refresh header.
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DishArt, dishTint } from '../../components/art/dish-art';
import { LinearGradient } from 'expo-linear-gradient';
import { useIslandSpace } from '../../lib/island';
import { imageBottomColor } from '../../lib/image-color';
import { CookEntryRow } from '../../components/cook-log-ui';
import { CollectionSheet } from '../../components/collection-sheet';
import { PlanSheet } from '../../components/plan-sheet';
import { ReadyBySheet } from '../../components/ready-by-sheet';
import { EditableTitle, IngredientList, MakesValue, ingCountText, scaleBy } from '../../components/recipe';
import { Btn, Card, Dock, Icon, IconBtn, Label, RichText, Screen, TopBar, Txt, type IconName } from '../../components/ui';
import { formatDuration, plainText } from '../../shared/parser';
import { useCookLog } from '../../lib/cook-log';
import { useShopping } from '../../lib/shopping';
import { useApp } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { UNIT_CHOICES, convertUnits, type UnitMode } from '../../lib/units';
import { SlidingChoice } from '../../components/sliding-choice';
import { showAlert } from '../../components/sheet';

export default function RecipeScreen() {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const island = useIslandSpace();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRecipe, patchRecipe, setProgress, deleteRecipe, settings, updateSettings } = useApp();
  const units = settings.units as UnitMode;
  const r = getRecipe(id);
  const [dockH, setDockH] = useState(0);
  const { addFromRecipe } = useShopping();
  const [planning, setPlanning] = useState(false);
  const [readyBy, setReadyBy] = useState(false);
  const [folders, setFolders] = useState(false);
  const cooks = useCookLog().entries.filter(e => e.recipeId === id);
  const [scrollY] = useState(() => new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [photoColor, setPhotoColor] = useState<string | null>(null);
  const pullY = useRef(0);

  const onRefresh = () => {
    if (refreshing) return;
    if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRefreshing(true);
    setRefreshKey(k => k + 1); // replays the dish animation
    if (id) patchRecipe(id, { lastOpened: Date.now() });
    setTimeout(() => setRefreshing(false), 800);
  };

  // Keep the live pull offset so releasing past the threshold triggers a refresh.
  useEffect(() => {
    const sub = scrollY.addListener(({ value }) => { pullY.current = value; });
    return () => scrollY.removeListener(sub);
  }, [scrollY]);

  // Sample the photo's average colour so the header matches it.
  useEffect(() => {
    if (!r?.photo) return;
    let alive = true;
    imageBottomColor(r.photo).then(c => { if (alive) setPhotoColor(c); }).catch(() => {});
    return () => { alive = false; };
  }, [r?.photo]);

  useEffect(() => { if (id) patchRecipe(id, { lastOpened: Date.now() }); }, [id, patchRecipe]);

  if (!r) return <Screen><TopBar><IconBtn name="arrow-back" label="Back" onPress={() => router.back()} /></TopBar></Screen>;

  const p = r.progress;
  const started = p.step > 0 && p.step < r.steps.length;

  const addToList = () => {
    const n = addFromRecipe(r);
    showAlert('Added to your shopping list', `${n} ${n === 1 ? 'ingredient' : 'ingredients'} from ${r.title}. Matching items are combined.`, [
      { text: 'OK', style: 'cancel' },
      { text: 'View list', onPress: () => router.push('/shopping') },
    ]);
  };

  const confirmDelete = () =>
    showAlert('Delete this recipe?', `“${r.title}” will be removed from this phone.`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteRecipe(r.id); router.back(); } },
    ]);

  const tint = dishTint(r.title, th.dark);
  // The colour the photo fades into at its bottom (its own edge colour for a seamless dissolve);
  // if we couldn't read it yet, fall back to the dish's colour so there's never a white gap.
  const edge = photoColor ?? tint;
  const topGap = insets.top + island;
  const photoH = topGap + 300;
  // Stretchy header: pulling down grows the dish band (anchored at the top), like Snap's refresh.
  const stretch = {
    transform: [
      { translateY: scrollY.interpolate({ inputRange: [-240, 0], outputRange: [-120, 0], extrapolateRight: 'clamp' }) },
      { scale: scrollY.interpolate({ inputRange: [-240, 0], outputRange: [1.28, 1], extrapolateRight: 'clamp' }) },
    ],
  };
  const pullOpacity = scrollY.interpolate({ inputRange: [-75, -18], outputRange: [1, 0], extrapolate: 'clamp' });
  const pullRotate = scrollY.interpolate({ inputRange: [-120, -30], outputRange: ['180deg', '0deg'], extrapolate: 'clamp' });
  return (
    <Screen>
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: dockH + 24 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        onScrollEndDrag={() => { if (pullY.current <= -72) onRefresh(); }}
      >
        {/* Full-width dish band that fades into the page, behind the top buttons. */}
        <Animated.View style={[stretch, r.photo ? { backgroundColor: edge } : null]}>
          {r.photo ? (
            // One container: photo, then a band that melts its bottom-edge colour into the page.
            // Keeping it all in one view means there's no seam between the photo and the colour.
            <View>
              <Image source={{ uri: r.photo }} style={{ width: '100%', height: photoH }} resizeMode="cover" />
              {/* dissolve the photo's bottom into its own edge colour */}
              <LinearGradient colors={['transparent', 'transparent', edge]} locations={[0, 0.6, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: photoH }} pointerEvents="none" />
              {/* darken the top a touch so the buttons read on the photo */}
              <LinearGradient colors={['rgba(0,0,0,0.32)', 'transparent']} locations={[0, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: topGap + 64 }} pointerEvents="none" />
              {/* melt the edge colour into the page (sits right under the photo, no gap) */}
              <LinearGradient colors={[edge, th.c.bg]} style={{ height: 140 }} pointerEvents="none" />
            </View>
          ) : (
            <LinearGradient
              colors={[tint, tint, tint, th.c.bg]}
              locations={[0, 0.45, 0.72, 1]}
              style={{ alignItems: 'center', paddingTop: topGap + 58, paddingBottom: 46 }}
            >
              <DishArt key={refreshKey} title={`${r.title} ${r.description}`} width={240} />
            </LinearGradient>
          )}
        </Animated.View>

        <View style={{ paddingHorizontal: 16, marginTop: r.photo ? -16 : -12 }}>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <EditableTitle recipe={r} />
            {r.description ? <Txt muted style={{ textAlign: 'center' }}>{plainText(r.description)}</Txt> : null}
          </View>

          {r.times.length ? (
            <Card style={{ flexDirection: 'row', marginTop: 16, paddingVertical: 12, paddingHorizontal: 4 }}>
              {r.times.map((t, i) => (
                <View key={t.label} style={{ flex: 1, alignItems: 'center', gap: 3, borderLeftWidth: i ? 1 : 0, borderLeftColor: th.c.line }}>
                  <Txt muted weight="black" size={11} style={{ letterSpacing: 0.4 }}>{t.label.toUpperCase()}</Txt>
                  <Txt weight="bold" size={15}>{t.value}</Txt>
                </View>
              ))}
            </Card>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {r.steps.length > 1 ? <ActionPill icon="alarm-outline" label="Ready by…" onPress={() => setReadyBy(true)} /> : null}
            <ActionPill icon={r.collections?.length ? 'folder' : 'folder-outline'} label={r.collections?.length ? r.collections.join(', ') : 'Add to collection'} onPress={() => setFolders(true)} />
          </View>

          <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingVertical: 10, paddingLeft: 18, paddingRight: 10 }}>
            <View>
              <Label color={th.c.muted}>{r.servings?.count ? 'Makes' : 'Recipe size'}</Label>
              <MakesValue recipe={r} />
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <IconBtn tinted name="remove" label="Make less" onPress={() => setProgress(r.id, { scale: scaleBy(r, -1) })} />
              <IconBtn tinted name="add" label="Make more" onPress={() => setProgress(r.id, { scale: scaleBy(r, 1) })} />
            </View>
          </Card>

        {r.ingredients.length ? (
          <Section title="Ingredients" aside={ingCountText(r)}>
            <SlidingChoice options={UNIT_CHOICES} value={units} onChange={v => updateSettings({ units: v })} height={34} />
            <IngredientList recipe={r} />
            <Pressable onPress={addToList} accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: th.c.accent, backgroundColor: pressed ? th.c.accentSoft : 'transparent' })}>
              <Icon name="cart-outline" size={20} color={th.c.accent} />
              <Txt weight="black" color={th.c.accent}>Add to shopping list</Txt>
            </Pressable>
          </Section>
        ) : null}

        {r.equipment.length ? (
          <Section title="Equipment">
            <RichText text={r.equipment.map(e => `• ${e}`).join('\n')} />
          </Section>
        ) : null}

        <Section title="Steps" aside={`${r.steps.length} steps`}>
          <View style={{ gap: 8 }}>
            {r.steps.map((s, i) => {
              const showPhase = s.phase && s.phase !== r.steps[i - 1]?.phase;
              const done = i < p.step;
              return (
                <View key={i} style={{ gap: 8 }}>
                  {showPhase ? <View style={{ marginTop: 8, marginLeft: 4 }}><Label>{s.phase}</Label></View> : null}
                  <Pressable onPress={() => router.push({ pathname: '/cook/[id]', params: { id: r.id, step: String(i) } })}>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 12, borderRadius: th.radiusSm, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
                      <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? th.c.accent : th.c.accentSoft }}>
                        {done ? <Icon name="checkmark" size={16} color={th.c.onAccent} /> : <Txt weight="black" size={14} color={th.c.accent}>{i + 1}</Txt>}
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Txt weight="black" size={16}>{s.title || convertUnits(plainText(s.text), units)}</Txt>
                        {s.title && s.text ? <Txt muted size={14} numberOfLines={2}>{convertUnits(plainText(s.text), units)}</Txt> : null}
                      </View>
                      {s.timers.length ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: th.c.accentSoft }}>
                          <Icon name="timer-outline" size={13} color={th.c.accent} />
                          <Txt weight="black" size={12} color={th.c.accent}>{formatDuration(s.timers[0].minutes)}</Txt>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Section>

        {cooks.length ? (
          <Section title="Your cooks" aside={cooks.length > 3 ? `See all ${cooks.length}` : undefined} onAside={() => router.push({ pathname: '/journal', params: { recipe: r.id } })}>
            <View style={{ gap: 8 }}>
              {cooks.slice(0, 3).map(e => (
                <CookEntryRow key={e.id} entry={e} onPress={() => router.push({ pathname: '/journal', params: { recipe: r.id } })} />
              ))}
            </View>
          </Section>
        ) : null}

        {r.notes.length ? (
          <Section title="Notes & tips">
            <View style={{ gap: 8 }}>
              {r.notes.map((n, i) => (
                <View key={i} style={{ padding: 14, borderRadius: th.radiusSm, backgroundColor: th.c.soft }}><RichText text={n} size={15} /></View>
              ))}
            </View>
          </Section>
        ) : null}
        </View>
      </Animated.ScrollView>

      {/* Pull-to-refresh indicator, near the top so it shows the moment you pull. */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: topGap + 50, alignSelf: 'center', opacity: refreshing ? 1 : pullOpacity }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.surface, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 }}>
          {refreshing
            ? <ActivityIndicator size="small" color={th.c.accent} />
            : <Animated.View style={{ transform: [{ rotate: pullRotate }] }}><Icon name="arrow-down" size={22} color={th.c.accent} /></Animated.View>}
        </View>
      </Animated.View>

      {/* Floating buttons over the dish band. */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: topGap + 6, left: 8, right: 8, flexDirection: 'row', alignItems: 'center' }}>
        <RoundIcon name="arrow-back" label="All recipes" onPress={() => router.back()} />
        <View style={{ flex: 1 }} />
        <RoundIcon name="calendar-outline" label="Add to meal plan" onPress={() => setPlanning(true)} />
        <RoundIcon name="create-outline" label="Edit recipe" onPress={() => router.push(`/edit/${r.id}`)} />
        <RoundIcon name="trash-outline" label="Delete recipe" onPress={confirmDelete} />
      </View>

      <Dock onHeight={setDockH}>
        {!started ? <Btn variant="secondary" size="big" icon="basket-outline" title="Prep" onPress={() => router.push(`/prep/${r.id}`)} accessibilityLabel="Mise en place: get everything ready first" /> : null}
        <Btn
          grow
          size="big"
          icon="play"
          title={started ? `Continue · step ${p.step + 1} of ${r.steps.length}` : 'Start cooking'}
          onPress={() => router.push({ pathname: '/cook/[id]', params: { id: r.id, step: String(started ? p.step : 0) } })}
        />
      </Dock>
      {folders ? <CollectionSheet recipe={r} visible onClose={() => setFolders(false)} /> : null}
      {readyBy ? <ReadyBySheet recipe={r} visible onClose={() => setReadyBy(false)} /> : null}
      <PlanSheet recipeId={r.id} title={r.title} visible={planning} onClose={() => setPlanning(false)} />
    </Screen>
  );
}

function Section({ title, aside, onAside, children }: { title: string; aside?: string; onAside?: () => void; children: React.ReactNode }) {
  const th = useTheme();
  return (
    <View style={{ marginTop: 28, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Txt kind="head" weight="bold" size={23}>{title}</Txt>
        {aside ? (onAside ? <Pressable onPress={onAside} hitSlop={8}><Txt weight="bold" size={14} color={th.c.accent}>{aside}</Txt></Pressable> : <Txt muted size={14}>{aside}</Txt>) : null}
      </View>
      {children}
    </View>
  );
}

// One of the two equal-width pills under the title (Ready by…, Add to collection).
function ActionPill({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 46, borderRadius: 23, backgroundColor: th.c.accentSoft, opacity: pressed ? 0.7 : 1 })}>
      <Icon name={icon} size={17} color={th.c.accent} />
      <Txt weight="black" size={14} color={th.c.accent} numberOfLines={1} style={{ flexShrink: 1 }}>{label}</Txt>
    </Pressable>
  );
}

// A round button that floats over the dish band, with a soft backing so it reads on the colour.
function RoundIcon({ name, label, onPress }: { name: IconName; label: string; onPress: () => void }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4}
      style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2, backgroundColor: th.dark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.6)', opacity: pressed ? 0.6 : 1 })}>
      <Icon name={name} size={22} color={th.c.text} />
    </Pressable>
  );
}
