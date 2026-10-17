// A scanned product: Nutri-Score, how processed it is, the sugar / fat / salt levels, nutrition per
// 100 g, allergens and ingredients. Add it to the shopping list, or ask Sous about it.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, View } from 'react-native';
import { Btn, Card, IconBtn, Screen, TopBar, Txt } from '../../components/ui';
import { AI_NAME } from '../../lib/chat-store';
import { FoodError, LEVEL_COLORS, NOVA_LABELS, NUTRISCORE_COLORS, fetchProduct, rememberScan, type Level, type Product } from '../../lib/food';
import { useShopping } from '../../lib/shopping';
import { useTheme } from '../../lib/theme';
import { showAlert } from '../../components/sheet';

const LEVEL_NAMES: Record<string, string> = { fat: 'Fat', 'saturated-fat': 'Saturated fat', sugars: 'Sugars', salt: 'Salt' };
const LEVEL_WORDS: Record<Level, string> = { low: 'Low', moderate: 'Moderate', high: 'High' };

export default function ProductScreen() {
  const th = useTheme();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { addText } = useShopping();
  const [state, setState] = useState<{ product?: Product | null; error?: string }>({});

  useEffect(() => {
    let alive = true;
    fetchProduct(String(code ?? ''))
      .then(p => {
        if (!alive) return;
        setState({ product: p });
        if (p) rememberScan(p).catch(() => {});
      })
      .catch(e => alive && setState({ error: e instanceof FoodError ? e.message : 'Something went wrong. Try again.' }));
    return () => { alive = false; };
  }, [code]);

  const p = state.product;

  const addToList = () => {
    if (!p) return;
    addText([p.brand, p.name].filter(Boolean).join(' '));
    showAlert('Added to your shopping list', p.name, [{ text: 'OK', style: 'cancel' }, { text: 'View list', onPress: () => router.push('/shopping') }]);
  };

  const ask = () => {
    if (!p) return;
    const facts = [
      p.nutriscore && `Nutri-Score ${p.nutriscore.toUpperCase()}`,
      p.nova && `NOVA ${p.nova}`,
      p.per100.kcal != null && `${p.per100.kcal} kcal, ${p.per100.sugars ?? '?'} g sugar, ${p.per100.salt ?? '?'} g salt per 100 g`,
    ].filter(Boolean).join('; ');
    router.navigate({ pathname: '/chat', params: { draft: `Is “${p.name}”${p.brand ? ` by ${p.brand}` : ''} a good choice? (${facts}) ` } });
  };

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }} numberOfLines={1}>{p ? p.name : 'Product'}</Txt>
      </TopBar>

      {state.product === undefined && !state.error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={th.c.accent} />
          <Txt muted>Looking it up…</Txt>
        </View>
      ) : state.error || !p ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 }}>
          <Txt kind="head" weight="bold" size={22} style={{ textAlign: 'center' }}>{state.error ? 'Couldn’t look it up' : 'Product not found'}</Txt>
          <Txt muted style={{ textAlign: 'center' }}>{state.error ?? `Barcode ${code} isn’t in Open Food Facts yet. It’s a free community database, and anyone can add products.`}</Txt>
          <Btn title="Scan another" icon="barcode-outline" variant="secondary" onPress={() => router.back()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 48, gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <View style={{ width: 92, height: 92, borderRadius: 20, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: th.c.line, alignItems: 'center', justifyContent: 'center' }}>
              {p.image ? <Image source={{ uri: p.image }} style={{ width: 92, height: 92 }} resizeMode="contain" /> : <Txt size={34}>🛒</Txt>}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt kind="head" weight="bold" size={22} numberOfLines={3}>{p.name}</Txt>
              <Txt muted>{[p.brand, p.quantity].filter(Boolean).join(' · ')}</Txt>
            </View>
          </View>

          {/* Nutri-Score: A–E with the product's letter raised */}
          <Card style={{ padding: 16, gap: 12 }}>
            <Txt weight="black">Nutri-Score</Txt>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end' }}>
              {(['a', 'b', 'c', 'd', 'e'] as const).map(g => {
                const on = p.nutriscore === g;
                return (
                  <View key={g} style={{ flex: 1, height: on ? 54 : 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: NUTRISCORE_COLORS[g], opacity: !p.nutriscore || on ? 1 : 0.35 }}>
                    <Txt weight="black" size={on ? 26 : 16} color="#FFFFFF">{g.toUpperCase()}</Txt>
                  </View>
                );
              })}
            </View>
            <Txt muted size={14}>{p.nutriscore ? { a: 'Very good nutritional quality.', b: 'Good nutritional quality.', c: 'Average nutritional quality.', d: 'Poor nutritional quality.', e: 'Bad nutritional quality.' }[p.nutriscore] : 'Not enough information for a Nutri-Score yet.'}</Txt>
          </Card>

          {p.nova ? (
            <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: ['#2E9E4F', '#E8A100', '#EE8100', '#E0452F'][p.nova - 1] }}>
                <Txt weight="black" size={22} color="#FFFFFF">{p.nova}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="black">NOVA group {p.nova}</Txt>
                <Txt muted size={14}>{NOVA_LABELS[p.nova]}</Txt>
              </View>
            </Card>
          ) : null}

          {Object.values(p.levels).some(Boolean) ? (
            <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
              {(Object.keys(LEVEL_NAMES) as (keyof Product['levels'])[]).filter(k => p.levels[k]).map((k, i, all) => {
                const lv = p.levels[k] as Level;
                const amount = { fat: p.per100.fat, 'saturated-fat': p.per100.saturated, sugars: p.per100.sugars, salt: p.per100.salt }[k];
                return (
                  <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: i === all.length - 1 ? 0 : 1, borderBottomColor: th.c.line }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: LEVEL_COLORS[lv] }} />
                    <Txt weight="bold" style={{ flex: 1 }}>{LEVEL_NAMES[k]}</Txt>
                    <Txt muted>{LEVEL_WORDS[lv]}{amount != null ? ` · ${amount} g` : ''}</Txt>
                  </View>
                );
              })}
            </Card>
          ) : null}

          <View style={{ gap: 8 }}>
            <Txt muted weight="black" size={13} style={{ marginLeft: 6, letterSpacing: 0.5 }}>NUTRITION PER 100 G</Txt>
            <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
              {([
                ['Energy', p.per100.kcal, 'kcal'], ['Fat', p.per100.fat, 'g'], ['  of which saturated', p.per100.saturated, 'g'],
                ['Carbohydrates', p.per100.carbs, 'g'], ['  of which sugars', p.per100.sugars, 'g'], ['Fibre', p.per100.fiber, 'g'],
                ['Protein', p.per100.protein, 'g'], ['Salt', p.per100.salt, 'g'],
              ] as [string, number | undefined, string][]).filter(([, v]) => v != null).map(([label, v, unit], i, all) => (
                <View key={label} style={{ flexDirection: 'row', paddingVertical: 10, borderBottomWidth: i === all.length - 1 ? 0 : 1, borderBottomColor: th.c.line }}>
                  <Txt weight={label.startsWith(' ') ? 'regular' : 'bold'} muted={label.startsWith(' ')} style={{ flex: 1 }}>{label.trim()}</Txt>
                  <Txt>{v} {unit}</Txt>
                </View>
              ))}
            </Card>
          </View>

          {p.allergens.length ? (
            <View style={{ gap: 8 }}>
              <Txt muted weight="black" size={13} style={{ marginLeft: 6, letterSpacing: 0.5 }}>ALLERGENS</Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {p.allergens.map(a => (
                  <View key={a} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#E0452F22' }}>
                    <Txt weight="bold" size={14} color="#C2381F">{a.charAt(0).toUpperCase() + a.slice(1)}</Txt>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {p.ingredients ? (
            <View style={{ gap: 8 }}>
              <Txt muted weight="black" size={13} style={{ marginLeft: 6, letterSpacing: 0.5 }}>INGREDIENTS</Txt>
              <Card style={{ padding: 16 }}><Txt size={14} style={{ lineHeight: 21 }}>{p.ingredients}</Txt></Card>
            </View>
          ) : null}

          <View style={{ gap: 10 }}>
            <Btn title={`Ask ${AI_NAME} about it`} icon="chatbubble-outline" onPress={ask} />
            <Btn title="Add to shopping list" icon="cart-outline" variant="secondary" onPress={addToList} />
          </View>

          <Txt muted size={12} style={{ textAlign: 'center' }} onPress={() => Linking.openURL(`https://world.openfoodfacts.org/product/${p.code}`).catch(() => {})}>
            Data from Open Food Facts (ODbL). Tap to see or improve this product.
          </Txt>
        </ScrollView>
      )}
    </Screen>
  );
}
