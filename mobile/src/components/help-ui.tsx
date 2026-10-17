// Pieces shared by the Help center screens: the list card (icon, title, chevron), article text
// with links, and the header with back and share buttons.
import { router } from 'expo-router';
import { Fragment, type ReactNode } from 'react';
import { Pressable, Share, View } from 'react-native';
import type { Block } from '../lib/help-content';
import { useTheme } from '../lib/theme';
import { Icon, IconBtn, PageTitle, TopBar, Txt, type IconName } from './ui';

export function HelpHeader({ title, share }: { title: string; share?: string }) {
  return (
    <TopBar>
      <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
      <PageTitle>{title}</PageTitle>
      {share ? <IconBtn name="share-outline" label="Share" onPress={() => Share.share({ message: share }).catch(() => {})} /> : <View style={{ width: 44 }} />}
    </TopBar>
  );
}

export function ListCard({ rows }: { rows: { key: string; title: string; icon: IconName; sub?: string; onPress: () => void }[] }) {
  const th = useTheme();
  return (
    <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
      {rows.map((r, i) => (
        <Pressable key={r.key} onPress={r.onPress} accessibilityRole="button"
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', backgroundColor: pressed ? th.c.soft : 'transparent' })}>
          <View style={{ width: 64, alignItems: 'center' }}>
            <Icon name={r.icon} size={23} color={th.c.accent} />
          </View>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 62, paddingVertical: 12, paddingRight: 16, borderTopWidth: i ? 1 : 0, borderTopColor: th.c.line }}>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={16}>{r.title}</Txt>
              {r.sub ? <Txt muted size={13} numberOfLines={1}>{r.sub}</Txt> : null}
            </View>
            <Icon name="chevron-forward" size={18} color={th.c.muted} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// Text with [label](article:id) and [label](/route) links.
export function RichLine({ text, size = 16, muted }: { text: string; size?: number; muted?: boolean }) {
  const th = useTheme();
  const parts: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const [, label, target] = m;
    const go = () => (target.startsWith('article:') ? router.push(`/help/article/${target.slice(8)}`) : router.push(target as '/help'));
    parts.push(<Txt key={m.index} size={size} weight="black" color={th.c.accent} onPress={go}>{label}</Txt>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <Txt size={size} muted={muted} style={{ lineHeight: size * 1.5 }}>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</Txt>;
}

export function ArticleBlocks({ blocks }: { blocks: Block[] }) {
  const th = useTheme();
  return (
    <View style={{ gap: 14 }}>
      {blocks.map((b, i) => {
        if ('p' in b) return <RichLine key={i} text={b.p} />;
        if ('h' in b) return <Txt key={i} weight="black" size={19} style={{ marginTop: 6 }}>{b.h}</Txt>;
        if ('note' in b) return (
          <View key={i} style={{ flexDirection: 'row', gap: 10, padding: 16, borderRadius: 16, backgroundColor: th.c.soft }}>
            <Icon name="information-circle-outline" size={20} color={th.c.accent} />
            <View style={{ flex: 1 }}><RichLine text={b.note} size={15} /></View>
          </View>
        );
        if ('bullets' in b) return (
          <View key={i} style={{ gap: 8, paddingLeft: 4 }}>
            {b.bullets.map((t, j) => (
              <View key={j} style={{ flexDirection: 'row', gap: 12 }}>
                <Txt size={16} style={{ lineHeight: 24 }}>•</Txt>
                <View style={{ flex: 1 }}><RichLine text={t} /></View>
              </View>
            ))}
          </View>
        );
        return (
          <View key={i} style={{ gap: 10 }}>
            {b.steps.map((t, j) => (
              <View key={j} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, marginTop: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
                  <Txt weight="black" size={13} color={th.c.accent}>{j + 1}</Txt>
                </View>
                <View style={{ flex: 1 }}><RichLine text={t} /></View>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

export function NeedMoreHelp() {
  const th = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 24 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.soft }}>
        <Icon name="chatbubbles-outline" size={28} color={th.c.muted} />
      </View>
      <Txt kind="head" weight="bold" size={22}>Need more help?</Txt>
      <Txt muted style={{ textAlign: 'center', maxWidth: 300 }}>Contact us and we’ll get back to you by email.</Txt>
      <Pressable onPress={() => router.push('/feedback?mode=issue')} hitSlop={8} style={{ marginTop: 6 }}>
        <Txt weight="black" size={17} color={th.c.accent}>Contact us</Txt>
      </Pressable>
    </View>
  );
}
