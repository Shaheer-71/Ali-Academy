import { Text, TextInput, Platform } from 'react-native';

// AGGRESSIVE FONT SCALING DISABLE - This prevents ANY device text size from affecting the app
// Import the forced components to ensure all text is protected

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

// Fixed text scaling configuration
export const TextScaling = {
    // Disable font scaling globally
    allowFontScaling: false,

    // Platform-adjusted font sizes for consistent rendering
    fontSizes: {
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
    },

    // Fixed line heights
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Font weights
    fontWeights: {
        regular: 'Inter-Regular',
        medium: 'Inter-Medium',
        semiBold: 'Inter-SemiBold',
    },
} as const;

// Helper function to create consistent text styles
export const createTextStyle = (
    fontSize: keyof typeof TextScaling.fontSizes,
    fontWeight: keyof typeof TextScaling.fontWeights = 'regular',
    lineHeight: keyof typeof TextScaling.lineHeights = 'normal'
) => ({
    fontSize: TextScaling.fontSizes[fontSize],
    fontFamily: TextScaling.fontWeights[fontWeight],
    lineHeight: TextScaling.fontSizes[fontSize] * TextScaling.lineHeights[lineHeight],
    allowFontScaling: false, // Explicitly disable font scaling
});

// Export default text props to use throughout the app
export const defaultTextProps = {
    allowFontScaling: false,
};

export const defaultTextInputProps = {
    allowFontScaling: false,
};