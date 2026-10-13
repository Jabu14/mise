// Friendly relative times for lists of chats and recipes.
// "just now", "5 minutes ago", "10 hours ago", "yesterday", "3 days ago", "last week", "2 weeks ago"…
export function timeAgo(time: number, now: number) {
  const s = Math.max(0, (now - time) / 1000);
  const m = s / 60, h = m / 60, d = h / 24;
  const n = (v: number, unit: string) => `${Math.floor(v)} ${unit}${Math.floor(v) === 1 ? '' : 's'} ago`;
  if (m < 1) return 'just now';
  if (h < 1) return n(m, 'minute');
  if (d < 1) return n(h, 'hour');
  if (d < 2) return 'yesterday';
  if (d < 7) return n(d, 'day');
  if (d < 14) return 'last week';
  if (d < 31) return n(d / 7, 'week');
  if (d < 62) return 'last month';
  return new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric', year: d > 330 ? 'numeric' : undefined });
}
