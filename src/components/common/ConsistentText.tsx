import React from 'react';
import { TextProps, StyleSheet, Platform } from 'react-native';
import { TextScaling, createTextStyle } from '@/src/constants/TextScaling';
import { ForcedText } from './ForcedText';

interface ConsistentTextProps extends TextProps {
  variant?: keyof typeof TextScaling.fontSizes;
  weight?: keyof typeof TextScaling.fontWeights;
  lineHeight?: keyof typeof TextScaling.lineHeights;
  color?: string;
}

export const ConsistentText: React.FC<ConsistentTextProps> = ({
  variant = 'base',
  weight = 'regular',
  lineHeight = 'normal',
  color = '#111827',
  style,
  children,
  ...props
}) => {
  const textStyle = createTextStyle(variant, weight, lineHeight);
  
  // Platform-specific styles to ensure consistent rendering
  const platformStyle = Platform.select({
    ios: {
      // iOS-specific adjustments for consistent text rendering
      includeFontPadding: false,
      textAlignVertical: 'center' as const,
    },
    android: {
      // Android-specific adjustments for consistent text rendering
      includeFontPadding: false,
      textAlignVertical: 'center' as const,
    },
    default: {},
  });
  
  return (
    <ForcedText
      style={[textStyle, platformStyle, { color }, style]}
      {...props}
    >
      {children}
    </ForcedText>
  );
};

// Predefined text variants for common use cases
export const TitleText: React.FC<Omit<ConsistentTextProps, 'variant' | 'weight'>> = (props) => (
  <ConsistentText variant="2xl" weight="semiBold" {...props} />
);

export const SubtitleText: React.FC<Omit<ConsistentTextProps, 'variant' | 'weight'>> = (props) => (
  <ConsistentText variant="lg" weight="semiBold" {...props} />
);

export const BodyText: React.FC<Omit<ConsistentTextProps, 'variant' | 'weight'>> = (props) => (
  <ConsistentText variant="base" weight="regular" {...props} />
);

export const CaptionText: React.FC<Omit<ConsistentTextProps, 'variant' | 'weight'>> = (props) => (
  <ConsistentText variant="sm" weight="regular" {...props} />
);

export const SmallText: React.FC<Omit<ConsistentTextProps, 'variant' | 'weight'>> = (props) => (
  <ConsistentText variant="xs" weight="regular" {...props} />
);
