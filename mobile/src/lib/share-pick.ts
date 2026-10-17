// The item chosen on the share picker page, handed back to the QR share page.
import { useSyncExternalStore } from 'react';

export type ShareKind = 'recipe' | 'book' | 'list' | 'chat' | 'setup';
type Picked = { kind: ShareKind; id: string; at: number } | null;

let picked: Picked = null;
const listeners = new Set<() => void>();

export function setPicked(kind: ShareKind, id: string) {
  picked = { kind, id, at: Date.now() };
  listeners.forEach(l => l());
}

export function usePicked() {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, () => picked, () => picked);
}
