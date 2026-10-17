// Mise's own pop-up sheets, used instead of the phone's plain alerts. A sheet slides up from the
// bottom while the app behind it shrinks back with rounded corners (like WhatsApp's account
// switcher). Drag it down or tap outside to close.
//
//   const sheet = useSheet();
//   sheet.open({ title, message, actions: [{ label, icon, onPress, destructive }] });
//   if (await sheet.confirm({ title, message, confirm: 'Delete', destructive: true })) …
//   sheet.open({ content: close => <MyPicker onDone={close} /> });
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Animated, Easing, PanResponder, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme';
import { Icon, Txt, type IconName } from './ui';

export type SheetAction = { label: string; icon?: IconName; destructive?: boolean; onPress?: () => void };
export type SheetOptions = {
  title?: string;
  message?: string;
  header?: ReactNode;
  actions?: SheetAction[];
  cancel?: string | false;
  content?: (close: () => void) => ReactNode;
  onClose?: () => void;
};

type SheetValue = {
  open: (o: SheetOptions) => void;
  close: (then?: () => void) => void;
  confirm: (o: { title: string; message?: string; confirm: string; destructive?: boolean; icon?: IconName }) => Promise<boolean>;
};

const Ctx = createContext<SheetValue | null>(null);
export const useSheet = () => useContext(Ctx)!;

export function SheetHost({ children }: { children: ReactNode }) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [current, setCurrent] = useState<SheetOptions | null>(null);
  const [anim] = useState(() => new Animated.Value(0));
  const [drag] = useState(() => new Animated.Value(0));
  // `then` runs once the sheet has finished sliding away, so navigation doesn't fight the animation.
  const close = useCallback((then?: () => void) => {
    const closed = current?.onClose;
    Animated.timing(anim, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: false }).start(() => {
      setCurrent(null);
      drag.setValue(0);
      then?.(); // the chosen action first, so a confirm knows it was answered
      closed?.();
    });
  }, [anim, drag, current]);

  const open = useCallback((o: SheetOptions) => {
    drag.setValue(0);
    setCurrent(o);
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, friction: 10, tension: 70, useNativeDriver: false }).start();
  }, [anim, drag]);

  const confirm = useCallback<SheetValue['confirm']>(o => new Promise(resolve => {
    let answered = false;
    open({
      title: o.title,
      message: o.message,
      actions: [{ label: o.confirm, icon: o.icon, destructive: o.destructive, onPress: () => { answered = true; resolve(true); } }],
      onClose: () => { if (!answered) resolve(false); },
    });
  }), [open]);

  const pick = (a: SheetAction) => close(a.onPress);

  // Drag the handle (or the top of the sheet) down to close.
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
    onPanResponderRelease: (_, g) => {
      if (g.dy > 90 || g.vy > 0.8) close();
      else Animated.spring(drag, { toValue: 0, friction: 8, useNativeDriver: false }).start();
    },
  });

  const value = useMemo(() => ({ open, close, confirm }), [open, close, confirm]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });
  const radius = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 28] });
  const shift = anim.interpolate({ inputRange: [0, 1], outputRange: [0, insets.top * 0.5 + 6] });
  const slide = Animated.add(anim.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }), drag);

  return (
    <Ctx.Provider value={value}>
      <SheetBridge />
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Animated.View style={{ flex: 1, overflow: 'hidden', borderRadius: radius, transform: [{ translateY: shift }, { scale }] }}>
          {children}
        </Animated.View>
        {current ? (
          <>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: anim }]}>
              <Pressable style={{ flex: 1 }} onPress={() => close()} accessibilityLabel="Close" />
            </Animated.View>
            <Animated.View {...pan.panHandlers}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: height * 0.88, transform: [{ translateY: slide }],
                paddingHorizontal: 16, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 16) + 4,
                borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: th.c.bg,
                shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: -4 }, elevation: 24 }}>
              <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: th.c.line, marginBottom: 14 }} />
              {current.title ? <Txt weight="black" size={19} style={{ textAlign: current.actions ? 'left' : 'center', marginBottom: current.message ? 4 : 12, paddingHorizontal: 4 }}>{current.title}</Txt> : null}
              {current.message ? <Txt muted size={15} style={{ marginBottom: 14, paddingHorizontal: 4 }}>{current.message}</Txt> : null}
              {current.header}
              {current.content ? current.content(() => close()) : null}
              {current.actions?.length ? (
                <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
                  {current.actions.map((a, i) => (
                    <Pressable key={a.label} onPress={() => pick(a)} accessibilityRole="button"
                      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, height: 58, backgroundColor: pressed ? th.c.soft : 'transparent', borderTopWidth: i ? 1 : 0, borderTopColor: th.c.line })}>
                      {a.icon ? <Icon name={a.icon} size={22} color={a.destructive ? th.c.temp : th.c.text} /> : null}
                      <Txt weight="bold" size={16} color={a.destructive ? th.c.temp : th.c.text}>{a.label}</Txt>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {current.cancel !== false && (current.actions?.length || !current.content) ? (
                <Pressable onPress={() => close()} accessibilityRole="button"
                  style={({ pressed }) => ({ marginTop: 10, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? th.c.line : th.c.soft })}>
                  <Txt weight="black" size={16}>{current.cancel || 'Cancel'}</Txt>
                </Pressable>
              ) : null}
            </Animated.View>
          </>
        ) : null}
      </View>
    </Ctx.Provider>
  );
}

// Drop-in for Alert.alert(title, message, buttons) that shows Mise's sheet instead. Not for code that
// runs inside another modal (the sheet would open behind it): those keep the phone's alert.
type AlertButton = { text?: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };
let host: SheetValue | null = null;
export function SheetBridge() {
  const sheet = useSheet();
  useEffect(() => { host = sheet; return () => { if (host === sheet) host = null; }; }, [sheet]);
  return null;
}
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (!host) return Alert.alert(title, message, buttons);
  const list = buttons?.length ? buttons : [{ text: 'OK', style: 'cancel' as const }];
  const cancel = list.find(b => b.style === 'cancel');
  const actions = list.filter(b => b !== cancel).map(b => ({ label: b.text ?? 'OK', destructive: b.style === 'destructive', onPress: b.onPress }));
  host.open({
    title, message,
    actions: actions.length ? actions : undefined,
    cancel: cancel?.text ?? (actions.length ? 'Cancel' : 'OK'),
    onClose: undefined,
  });
}
