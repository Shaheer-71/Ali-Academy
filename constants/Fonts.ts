export const Fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
} as const;

export const FontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
} as const;

export const LineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const createTextStyle = (
  fontSize: keyof typeof FontSizes,
  fontFamily: keyof typeof Fonts = 'regular',
  lineHeight: keyof typeof LineHeights = 'normal'
) => ({
  fontSize: FontSizes[fontSize],
  fontFamily: Fonts[fontFamily],
  lineHeight: FontSizes[fontSize] * LineHeights[lineHeight],
});