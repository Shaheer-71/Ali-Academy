import { useMemo } from 'react';
import { TextScaling, createTextStyle } from '@/src/constants/TextScaling';

export const useConsistentText = () => {
  const textStyles = useMemo(() => ({
    // Predefined text styles for common use cases
    title: createTextStyle('2xl', 'semiBold', 'tight'),
    subtitle: createTextStyle('lg', 'medium', 'normal'),
    body: createTextStyle('base', 'regular', 'normal'),
    caption: createTextStyle('sm', 'regular', 'normal'),
    small: createTextStyle('xs', 'regular', 'normal'),
    
    // Heading styles
    h1: createTextStyle('4xl', 'semiBold', 'tight'),
    h2: createTextStyle('3xl', 'semiBold', 'tight'),
    h3: createTextStyle('2xl', 'medium', 'normal'),
    h4: createTextStyle('xl', 'medium', 'normal'),
    h5: createTextStyle('lg', 'medium', 'normal'),
    h6: createTextStyle('base', 'medium', 'normal'),
    
    // Button text styles
    button: createTextStyle('base', 'medium', 'normal'),
    buttonSmall: createTextStyle('sm', 'medium', 'normal'),
    
    // Form text styles
    label: createTextStyle('sm', 'medium', 'normal'),
    input: createTextStyle('base', 'regular', 'normal'),
    placeholder: createTextStyle('base', 'regular', 'normal'),
    
    // Status and notification styles
    badge: createTextStyle('xs', 'medium', 'normal'),
    notification: createTextStyle('sm', 'regular', 'normal'),
  }), []);

  const getTextStyle = (
    variant: keyof typeof TextScaling.fontSizes,
    weight: keyof typeof TextScaling.fontWeights = 'regular',
    lineHeight: keyof typeof TextScaling.lineHeights = 'normal'
  ) => {
    return createTextStyle(variant, weight, lineHeight);
  };

  return {
    textStyles,
    getTextStyle,
    fontSizes: TextScaling.fontSizes,
    fontWeights: TextScaling.fontWeights,
    lineHeights: TextScaling.lineHeights,
    // Default props to ensure consistent rendering
    defaultTextProps: {
      allowFontScaling: false,
    },
    defaultTextInputProps: {
      allowFontScaling: false,
    },
  };
};
