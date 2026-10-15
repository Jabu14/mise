// Put a recipe in collections ("Weeknight", "Baking", "Mum's recipes"). Pick from the ones you've
// made already or type a new one.
import { useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useApp, type Recipe } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Icon, IconBtn, Txt } from './ui';

const IDEAS = ['Weeknight', 'Baking', 'Favourites', 'Quick', 'Healthy', 'For guests'];

// Every collection name in use, most used first.
export function allCollections(recipes: Recipe[]) {
  const counts = new Map<string, number>();
  recipes.forEach(r => r.collections?.forEach(c => counts.set(c, (counts.get(c) || 0) + 1)));
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
}

export function CollectionSheet({ recipe: r, visible, onClose }: { recipe: Recipe; visible: boolean; onClose: () => void }) {
  const th = useTheme();
  const { recipes, patchRecipe } = useApp();
  const [text, setText] = useState('');
  const mine = new Set(r.collections ?? []);
  const existing = allCollections(recipes).map(c => c.name);
  const names = [...new Set([...existing, ...IDEAS.filter(i => !existing.some(e => e.toLowerCase() === i.toLowerCase()))])];

  const toggle = (name: string) => {
    const next = new Set(mine);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    patchRecipe(r.id, { collections: [...next].slice(0, 12) });
  };
  const create = () => {
    const name = text.trim().slice(0, 30);
    if (!name) return;
    const same = names.find(n => n.toLowerCase() === name.toLowerCase());
    if (!mine.has(same ?? name)) toggle(same ?? name);
    setText('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: th.c.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <View style={{ flex: 1 }}>
            <Txt kind="head" weight="bold" size={22}>Collections</Txt>
            <Txt muted numberOfLines={1}>{r.title}</Txt>
          </View>
          <IconBtn name="close" label="Done" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 14 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, paddingLeft: 16, paddingRight: 6, borderRadius: 25, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
            <TextInput value={text} onChangeText={setText} placeholder="New collection, e.g. Sunday lunch" placeholderTextColor={th.c.muted} maxLength={30} returnKeyType="done" onSubmitEditing={create}
              style={[{ flex: 1, minWidth: 0, color: th.c.text, fontSize: th.fs(16), paddingVertical: 0 }, th.f('body')]} />
            <Pressable onPress={create} disabled={!text.trim()} accessibilityLabel="Create collection" style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: text.trim() ? th.c.accent : th.c.soft }}>
              <Icon name="add" size={22} color={text.trim() ? th.c.onAccent : th.c.muted} />
            </Pressable>
          </View>
          <View style={{ gap: 8 }}>
            {names.map(n => {
              const on = mine.has(n);
              return (
                <Pressable key={n} onPress={() => toggle(n)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: th.radiusSm, backgroundColor: pressed ? th.c.soft : th.c.surface, borderWidth: 1, borderColor: on ? th.c.accent : th.c.line })}>
                  <Icon name={on ? 'folder' : 'folder-outline'} size={20} color={on ? th.c.accent : th.c.muted} />
                  <Txt weight="bold" style={{ flex: 1 }}>{n}</Txt>
                  {on ? <Icon name="checkmark-circle" size={22} color={th.c.accent} /> : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
