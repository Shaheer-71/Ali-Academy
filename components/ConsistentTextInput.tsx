import React from 'react';
import { TextInputProps, StyleSheet, Platform } from 'react-native';
import { TextScaling, createTextStyle } from '@/constants/TextScaling';
import { ForcedTextInput } from './ForcedText';

interface ConsistentTextInputProps extends TextInputProps {
  variant?: keyof typeof TextScaling.fontSizes;
  weight?: keyof typeof TextScaling.fontWeights;
  lineHeight?: keyof typeof TextScaling.lineHeights;
  color?: string;
}

export const ConsistentTextInput: React.FC<ConsistentTextInputProps> = ({
  variant = 'base',
  weight = 'regular',
  lineHeight = 'normal',
  color = '#111827',
  style,
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
    <ForcedTextInput
      style={[textStyle, platformStyle, { color }, style]}
      {...props}
    />
  );
};
