export const DEFAULT_TAG_COLOR = '#a1a1aa';

export const TAG_COLOR_OPTIONS = [
  { name: 'Zinc 400', hex: '#a1a1aa' },
  { name: 'Zinc 300', hex: '#d4d4d8' },
  { name: 'Zinc 200', hex: '#e4e4e7' },
  { name: 'Zinc 500', hex: '#71717a' },
  { name: 'Zinc 600', hex: '#52525b' },
] as const;

const monochromeTagColors = new Set<string>(TAG_COLOR_OPTIONS.map(color => color.hex));

export function getMonochromeTagColor(color?: string | null): string {
  const normalized = color?.toLowerCase();
  return normalized && monochromeTagColors.has(normalized) ? normalized : DEFAULT_TAG_COLOR;
}
