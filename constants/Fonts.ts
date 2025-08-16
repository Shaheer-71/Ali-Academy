import { Platform } from 'react-native';

export const Fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
} as const;

// Platform-specific font size adjustments to ensure consistent rendering
const getPlatformAdjustedSize = (size: number) => {
  if (Platform.OS === 'ios') {
    // iOS renders fonts larger, so we reduce the size to match Android
    return Math.round(size * 0.85);
  } else if (Platform.OS === 'android') {
    // Android renders fonts smaller, so we reduce by 1px to match iOS
    return Math.max(size - 1, 1); // Ensure minimum 1px
  }
  return size;
};

export const FontSizes = {
  xs: getPlatformAdjustedSize(9),     // Regular text (small)
  sm: getPlatformAdjustedSize(9),     // Regular text
  base: getPlatformAdjustedSize(9),   // Regular text (default)
  lg: getPlatformAdjustedSize(10),    // Subheading
  xl: getPlatformAdjustedSize(10),    // Subheading
  '2xl': getPlatformAdjustedSize(11), // Heading
  '3xl': getPlatformAdjustedSize(11), // Heading
  '4xl': getPlatformAdjustedSize(11), // Heading
  '5xl': getPlatformAdjustedSize(11), // Heading
  '6xl': getPlatformAdjustedSize(11), // Heading
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
  allowFontScaling: false, // Disable font scaling for consistency
});

// Default props to ensure consistent text rendering
export const defaultTextProps = {
  allowFontScaling: false,
};

export const defaultTextInputProps = {
  allowFontScaling: false,
};