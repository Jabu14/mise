// Shopping list: what to buy, grouped by aisle, with what's already in your cart at the bottom.
// Tap to tick off, swipe left to remove, type to add your own items.
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import { DishArt } from '../components/art/dish-art';
import { SwipeRow } from '../components/swipe-row';
import { Card, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { AISLES, itemLabel, useShopping, type ShopItem } from '../lib/shopping';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';

export default function ShoppingScreen() {
  const th = useTheme();
  const { settings } = useApp();
  const { items, addText, toggle, remove, clearChecked, clearAll } = useShopping();
  const [text, setText] = useState('');
  const [revealed, setRevealed] = useState<string | null>(null);

  const toBuy = items.filter(i => !i.checked);
  const inCart = items.filter(i => i.checked);
  const groups = AISLES.map(a => ({ aisle: a, list: toBuy.filter(i => i.aisle === a) })).filter(g => g.list.length);

  const add = () => {
    if (!text.trim()) return;
    addText(text);
    setText('');
  };

  const tick = (id: string) => {
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    toggle(id);
  };

  const share = () => {
    const lines = groups.flatMap(g => [g.aisle.toUpperCase(), ...g.list.map(i => `• ${itemLabel(i)}`), '']);
    Share.share({ message: `Shopping list\n\n${lines.join('\n').trim()}\n\nFrom Mise` }).catch(() => {});
  };

  const more = () =>
    Alert.alert('Shopping list', undefined, [
      { text: 'Share list', onPress: share },
      ...(inCart.length ? [{ text: `Remove ${inCart.length} ticked`, onPress: clearChecked }] : []),
      { text: 'Clear the whole list', style: 'destructive' as const, onPress: () => Alert.alert('Clear the list?', 'Every item will be removed.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: clearAll }]) },
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  const row = (i: ShopItem, last: boolean) => (
    <SwipeRow key={i.id} haptics={settings.haptics} onDelete={() => remove(i.id)} revealed={revealed === i.id} onRevealChange={open => setRevealed(open ? i.id : null)}>
      <Pressable onPress={() => tick(i.id)} accessibilityRole="checkbox" accessibilityState={{ checked: i.checked }}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: pressed ? th.c.soft : th.c.surface, borderBottomWidth: last ? 0 : 1, borderBottomColor: th.c.line })}>
        <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderColor: i.checked ? th.c.accent : th.c.line, backgroundColor: i.checked ? th.c.accent : 'transparent' }}>
          {i.checked ? <Icon name="checkmark" size={15} color={th.c.onAccent} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Txt weight="bold" size={16} color={i.checked ? th.c.muted : th.c.text} style={i.checked ? { textDecorationLine: 'line-through' } : undefined}>{itemLabel(i)}</Txt>
          {i.sources.length ? <Txt muted size={12} numberOfLines={1}>{i.sources.join(' · ')}</Txt> : null}
        </View>
      </Pressable>
    </SwipeRow>
  );

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <View style={{ flex: 1, paddingLeft: 4 }}>
          <Txt kind="head" weight="bold" size={19}>Shopping list</Txt>
          {items.length ? <Txt muted size={13}>{toBuy.length ? `${toBuy.length} to buy` : 'All done!'}{inCart.length ? ` · ${inCart.length} in your cart` : ''}</Txt> : null}
        </View>
        <IconBtn name="barcode-outline" label="Scan food" onPress={() => router.push('/scan')} />
        {items.length ? <IconBtn name="ellipsis-horizontal" label="More" onPress={more} /> : null}
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 6, paddingBottom: 48, gap: 14 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingLeft: 18, paddingRight: 6, borderRadius: 26, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
          <TextInput value={text} onChangeText={setText} onSubmitEditing={add} returnKeyType="done" blurOnSubmit={false} placeholder="Add an item, e.g. 2 lemons" placeholderTextColor={th.c.muted} maxLength={200}
            style={[{ flex: 1, minWidth: 0, color: th.c.text, fontSize: th.fs(16), paddingVertical: 0 }, th.f('body')]} />
          <Pressable onPress={add} disabled={!text.trim()} accessibilityRole="button" accessibilityLabel="Add item"
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: text.trim() ? th.c.accent : th.c.soft }}>
            <Icon name="add" size={22} color={text.trim() ? th.c.onAccent : th.c.muted} />
          </Pressable>
        </View>

        {!items.length ? (
          <View style={{ alignItems: 'center', gap: 10, paddingTop: 30 }}>
            <DishArt title="salad" width={180} />
            <Txt kind="head" weight="bold" size={22}>Your list is empty</Txt>
            <Txt muted style={{ textAlign: 'center', maxWidth: 290 }}>Open any recipe and tap “Add to shopping list”. Matching ingredients are combined for you.</Txt>
          </View>
        ) : null}

        {groups.map(g => (
          <View key={g.aisle} style={{ gap: 6 }}>
            <Txt muted weight="black" size={13} style={{ marginLeft: 6, letterSpacing: 0.5 }}>{g.aisle.toUpperCase()}</Txt>
            <Card style={{ padding: 0, overflow: 'hidden' }}>{g.list.map((i, k) => row(i, k === g.list.length - 1))}</Card>
          </View>
        ))}

        {inCart.length ? (
          <View style={{ gap: 6, marginTop: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Txt muted weight="black" size={13} style={{ flex: 1, marginLeft: 6, letterSpacing: 0.5 }}>IN YOUR CART</Txt>
              <Pressable onPress={clearChecked} hitSlop={8}><Txt weight="bold" size={13} color={th.c.accent}>Remove all</Txt></Pressable>
            </View>
            <Card style={{ padding: 0, overflow: 'hidden', opacity: 0.85 }}>{inCart.map((i, k) => row(i, k === inCart.length - 1))}</Card>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
