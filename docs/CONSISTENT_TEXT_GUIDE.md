# Consistent Text Sizing Guide

This guide explains how to ensure consistent text sizes and styling across all devices, regardless of the user's device accessibility settings.

## Overview

The app implements a comprehensive text scaling system that:
- Disables font scaling globally to prevent device accessibility settings from affecting text sizes
- Provides consistent font sizes across all devices
- Offers predefined text components for common use cases
- Ensures uniform typography throughout the app

## Key Features

### 1. AGGRESSIVE Global Font Scaling Disabled
- **Global Override**: All Text and TextInput components are automatically protected
- **Forced Components**: Custom `ForcedText` and `ForcedTextInput` components ensure protection
- **Device Settings Ignored**: System accessibility settings will NEVER affect app text sizes
- **Consistent Appearance**: Text sizes remain exactly the same regardless of device settings

### 2. Platform-Adjusted Font Sizes
```typescript
// Platform-specific adjustments ensure consistent rendering
const getPlatformAdjustedSize = (size: number) => {
  if (Platform.OS === 'ios') {
    return Math.round(size * 0.85); // iOS renders larger, so we reduce to match Android
  } else if (Platform.OS === 'android') {
    return Math.max(size - 1, 1); // Android renders smaller, so we reduce by 1px to match iOS
  }
  return size;
};

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
}
```

### 3. Font Weights
```typescript
fontWeights: {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
}
```

## Usage

### Option 1: Use Predefined Text Components (Recommended)

```tsx
import { 
  TitleText, 
  SubtitleText, 
  BodyText, 
  CaptionText, 
  SmallText 
} from '@/components/ConsistentText';

// In your component
<TitleText>Main Heading</TitleText>
<SubtitleText>Subtitle</SubtitleText>
<BodyText>Regular body text</BodyText>
<CaptionText>Caption or small text</CaptionText>
<SmallText>Very small text</SmallText>
```

### Option 2: Use ConsistentText with Custom Variants

```tsx
import { ConsistentText } from '@/components/ConsistentText';

<ConsistentText variant="xl" weight="medium" color="#333">
  Custom styled text
</ConsistentText>
```

### Option 3: Use the Hook for Dynamic Styling

```tsx
import { useConsistentText } from '@/hooks/useConsistentText';

const MyComponent = () => {
  const { textStyles, getTextStyle } = useConsistentText();
  
  return (
    <Text style={textStyles.title}>Title</Text>
    <Text style={getTextStyle('lg', 'medium', 'normal')}>
      Custom text
    </Text>
  );
};
```

### Option 4: Use ConsistentTextInput for Input Fields

```tsx
import { ConsistentTextInput } from '@/components/ConsistentTextInput';

<ConsistentTextInput 
  variant="base" 
  weight="regular"
  placeholder="Enter text..."
/>
```

### Option 5: Use Forced Components for Maximum Protection

```tsx
import { ForcedText, ForcedTextInput } from '@/components/ForcedText';

// These components ALWAYS disable font scaling, even if you forget to add the prop
<ForcedText style={{ fontSize: 16 }}>This text is always protected</ForcedText>
<ForcedTextInput placeholder="This input is always protected" />
```

## Migration Guide

### Before (Inconsistent)
```tsx
<Text style={{ fontSize: 16, fontFamily: 'Inter-Regular' }}>
  This text might scale with device settings
</Text>
```

### After (Consistent)
```tsx
import { BodyText } from '@/components/ConsistentText';

<BodyText>This text will always be the same size</BodyText>
```

## Best Practices

1. **Always use the predefined components** when possible
2. **Avoid inline font styles** - use the consistent text system instead
3. **Use semantic naming** - choose components based on their purpose, not just size
4. **Test on different devices** to ensure consistency
5. **Use the hook** for dynamic styling needs

## Available Components

### Text Components
- `TitleText` - For main headings (platform-adjusted 11px, semiBold)
- `SubtitleText` - For subtitles (platform-adjusted 10px, semiBold)
- `BodyText` - For regular content (platform-adjusted 9px, regular)
- `CaptionText` - For captions and labels (platform-adjusted 9px, regular)
- `SmallText` - For very small text (platform-adjusted 9px, regular)

### TextInput Component
- `ConsistentTextInput` - For input fields with consistent styling

## Configuration Files

- `constants/TextScaling.ts` - Global text scaling configuration
- `components/ConsistentText.tsx` - Text components
- `components/ConsistentTextInput.tsx` - TextInput component
- `hooks/useConsistentText.ts` - Hook for dynamic styling

## Troubleshooting

### Text Still Scaling?
1. Ensure you're using the ConsistentText components
2. Check that `allowFontScaling={false}` is set
3. Verify the TextScaling import is in your root layout

### Font Not Loading?
1. Check that fonts are properly loaded in `app/_layout.tsx`
2. Verify font files are included in the app bundle
3. Ensure font family names match exactly

### Inconsistent Sizes?
1. Use the predefined components instead of custom styles
2. Check that you're not overriding the `allowFontScaling` prop
3. Verify you're using the correct font weights and sizes

## Example Implementation

```tsx
import React from 'react';
import { View } from 'react-native';
import { 
  TitleText, 
  SubtitleText, 
  BodyText, 
  CaptionText 
} from '@/components/ConsistentText';

export const MyScreen = () => {
  return (
    <View>
      <TitleText>Welcome to the App</TitleText>
      <SubtitleText>Your dashboard</SubtitleText>
      <BodyText>This is the main content area with consistent text sizing.</BodyText>
      <CaptionText>Last updated: Today</CaptionText>
    </View>
  );
};
```

This system ensures that your app's text will look exactly the same on all devices, regardless of the user's accessibility settings or device preferences.
