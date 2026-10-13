// The voices Sous can speak with in voice mode (previewed with the phone's speech engine for now).
export const VOICES: Record<string, { name: string; feel: string; pitch: number; rate: number }> = {
  basil: { name: 'Basil', feel: 'Warm and friendly', pitch: 1.0, rate: 0.95 },
  saffron: { name: 'Saffron', feel: 'Bright and upbeat', pitch: 1.25, rate: 1.05 },
  juniper: { name: 'Juniper', feel: 'Calm and gentle', pitch: 0.95, rate: 0.85 },
  clove: { name: 'Clove', feel: 'Deep and steady', pitch: 0.75, rate: 0.9 },
};
