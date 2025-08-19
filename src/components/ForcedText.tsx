import React from 'react';
import { Text, TextInput, TextProps, TextInputProps } from 'react-native';

// AGGRESSIVE FONT SCALING DISABLE - These components ALWAYS disable font scaling
// Use these instead of regular Text/TextInput to ensure device text size never affects your app

export const ForcedText: React.FC<TextProps> = (props) => {
  return <Text {...props} allowFontScaling={false} />;
};

export const ForcedTextInput: React.FC<TextInputProps> = (props) => {
  return <TextInput {...props} allowFontScaling={false} />;
};
