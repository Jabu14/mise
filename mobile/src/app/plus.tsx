// Mise Plus: the subscription page, laid out like Google One's: a Monthly / Annual switch, then a card
// per plan with its price, a "Get" button and what it includes (tap "Show all benefits" for the rest).
// Payments aren't connected yet: the buttons explain that it's coming soon. Prices are placeholders
// to settle before launch (they must match what's set up in App Store Connect / Google Play).
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlidingChoice } from '../components/sliding-choice';
import { Btn, Icon, Txt, type IconName } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { useTheme } from '../lib/theme';

type Billing = 'monthly' | 'annual';
type Perk = { icon: IconName; title: string; text: string };
type Tier = {
  key: string; name: string; chip: string; recommended?: boolean;
  price: Record<Billing, string>; per: Record<Billing, string>; perks: Perk[]; more: Perk[];
};

const TIERS: Tier[] = [
  {
    key: 'plus', name: 'Mise Plus', chip: 'Unlimited AI imports', recommended: true,
    price: { monthly: '$4.99', annual: '$39.99' }, per: { monthly: '/mo', annual: '/yr' },
    perks: [
      { icon: 'sparkles-outline', title: 'Unlimited Import with AI', text: 'Turn any link, photo or note into a recipe, as often as you like.' },
      { icon: 'chatbubble-outline', title: `${AI_NAME}, fully unlocked`, text: 'Remembers your tastes and knows which step you’re on.' },
      { icon: 'mic-outline', title: 'Voice commands', text: 'Say “next” or “start the timer” while your hands are busy.' },
    ],
    more: [
      { icon: 'calendar-outline', title: 'Meal planner & shopping list', text: 'Plan the week and get one tidy list for the shop.' },
      { icon: 'cloud-outline', title: 'Sync across devices', text: 'Your recipes and chats on every phone and tablet.' },
    ],
  },
  {
    key: 'pro', name: 'Mise Pro', chip: 'For the whole family',
    price: { monthly: '$9.99', annual: '$79.99' }, per: { monthly: '/mo', annual: '/yr' },
    perks: [
      { icon: 'checkmark-done-outline', title: 'Everything in Plus', text: 'All the Plus features, included.' },
      { icon: 'people-outline', title: 'Share with up to 6 people', text: 'One plan for the household, each with their own recipes and chats.' },
      { icon: 'volume-high-outline', title: 'Lifelike AI voices', text: `${AI_NAME} reads steps in natural, studio-quality voices.` },
    ],
    more: [
      { icon: 'flash-outline', title: 'Priority AI', text: 'Faster answers and imports when it’s busy.' },
      { icon: 'color-palette-outline', title: 'Extra looks for the cooks', text: 'Seasonal outfits, themes and app icons, first.' },
    ],
  },
  {
    key: 'chef', name: 'Mise Chef', chip: 'For serious home cooks',
    price: { monthly: '$19.99', annual: '$159.99' }, per: { monthly: '/mo', annual: '/yr' },
    perks: [
      { icon: 'checkmark-done-outline', title: 'Everything in Pro', text: 'All the Plus and Pro features, included.' },
      { icon: 'nutrition-outline', title: 'Nutrition for every recipe', text: 'Calories, protein, carbs and more, adjusted when you scale a recipe.' },
      { icon: 'barbell-outline', title: 'Meal plans that fit your goals', text: `${AI_NAME} builds weekly plans around your diet and targets.` },
    ],
    more: [
      { icon: 'book-outline', title: 'Your own cookbook', text: 'Turn your recipes into a beautiful shareable cookbook.' },
      { icon: 'rocket-outline', title: 'Early access', text: 'Try new features before everyone else.' },
    ],
  },
];

export default function PlusScreen() {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const [billing, setBilling] = useState<Billing>('monthly');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const soon = (name: string) => Alert.alert(`${name} is coming soon`, 'Subscriptions aren’t open yet. Everything in Mise is free while we get them ready.');

  return (
    <View style={{ flex: 1, backgroundColor: th.c.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 56 }}>
        <Txt kind="head" weight="bold" size={22} style={{ flex: 1 }}>Mise Plus</Txt>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}>
          <Icon name="close" size={26} color={th.c.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: insets.bottom + 40, gap: 18 }}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Txt kind="head" weight="bold" size={30} style={{ textAlign: 'center', lineHeight: 38 }}>
            Upgrade for more from{'\n'}<Txt kind="head" weight="bold" size={34} color={th.c.accent}>Mise</Txt>
          </Txt>
          <Txt muted size={13} style={{ textAlign: 'center', maxWidth: 320 }}>
            Cancel anytime. By subscribing, you agree to the{' '}
            <Txt size={13} color={th.c.accent} style={{ textDecorationLine: 'underline' }} onPress={() => router.push('/legal?doc=terms')}>Terms of Use</Txt>
            {' '}and see how{' '}
            <Txt size={13} color={th.c.accent} style={{ textDecorationLine: 'underline' }} onPress={() => router.push('/legal?doc=privacy')}>Mise handles data</Txt>.
          </Txt>
        </View>

        {/* Monthly / Annual */}
        <View style={{ alignItems: 'center', gap: 10 }}>
          <View style={{ alignSelf: 'stretch', marginHorizontal: 24 }}>
            <SlidingChoice options={[['monthly', 'Monthly'], ['annual', 'Annual']]} value={billing} onChange={v => setBilling(v as Billing)} accent height={44} />
          </View>
          <Txt weight="bold" size={15} color={th.c.accent}>{billing === 'monthly' ? 'Save more with annual billing' : 'You save about 33% with annual billing'}</Txt>
        </View>

        {/* Plans */}
        {TIERS.map(t => {
          const expanded = !!open[t.key];
          return (
            <View key={t.key} style={{ padding: 22, gap: 18, borderRadius: 28, backgroundColor: th.c.surface, borderWidth: t.recommended ? 2.5 : 1, borderColor: t.recommended ? th.c.accent : th.c.line }}>
              <View style={{ gap: 8 }}>
                {t.recommended ? <Txt weight="black" size={13} color={th.c.accent} style={{ letterSpacing: 0.6 }}>RECOMMENDED</Txt> : null}
                <Txt kind="head" weight="bold" size={28}>{t.name}</Txt>
                <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: th.c.soft }}>
                  <Icon name="sparkles-outline" size={15} color={th.c.text} />
                  <Txt weight="bold" size={14}>{t.chip}</Txt>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                <Txt kind="head" weight="bold" size={46} style={{ lineHeight: 52 }}>{t.price[billing]}</Txt>
                <Txt weight="bold" size={18} muted style={{ marginBottom: 6 }}>{t.per[billing]}</Txt>
              </View>

              <Btn title={`Get ${t.name}`} size="big" variant={t.recommended ? 'primary' : 'secondary'} onPress={() => soon(t.name)} />

              <View style={{ gap: 16 }}>
                {(expanded ? [...t.perks, ...t.more] : t.perks).map(p => (
                  <View key={p.title} style={{ flexDirection: 'row', gap: 14 }}>
                    <View style={{ width: 28, alignItems: 'center', paddingTop: 1 }}><Icon name={p.icon} size={23} color={th.c.text} /></View>
                    <View style={{ flex: 1 }}>
                      <Txt weight="bold" size={16}>{p.title}</Txt>
                      <Txt muted size={15} style={{ lineHeight: 21 }}>{p.text}</Txt>
                    </View>
                  </View>
                ))}
              </View>

              <Pressable onPress={() => setOpen(o => ({ ...o, [t.key]: !expanded }))} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Txt weight="bold" size={15} color={th.c.accent} style={{ textDecorationLine: 'underline' }}>{expanded ? 'Show fewer benefits' : 'Show all benefits'}</Txt>
                <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={th.c.accent} />
              </Pressable>
            </View>
          );
        })}

        <View style={{ gap: 8, paddingHorizontal: 8 }}>
          <Txt muted size={12} style={{ textAlign: 'center' }}>Prices are in US dollars and may change before launch. Subscriptions renew automatically until you cancel in your App Store or Google Play account settings.</Txt>
          <Txt muted size={12} style={{ textAlign: 'center' }}>Some features are still being built and will arrive during your subscription.</Txt>
        </View>
      </ScrollView>
    </View>
  );
}
