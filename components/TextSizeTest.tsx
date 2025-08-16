import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  TitleText, 
  SubtitleText, 
  BodyText, 
  CaptionText, 
  SmallText,
  ConsistentText 
} from './ConsistentText';

import { Platform } from 'react-native';

export const TextSizeTest: React.FC = () => {
  // Calculate platform-adjusted sizes for display
  const getPlatformAdjustedSize = (size: number) => {
    if (Platform.OS === 'ios') {
      return Math.round(size * 0.85);
    } else if (Platform.OS === 'android') {
      return Math.max(size - 1, 1); // Ensure minimum 1px
    }
    return size;
  };

  return (
    <View style={styles.container}>
      <TitleText>Title Text ({getPlatformAdjustedSize(11)}px, Bold)</TitleText>
      <SubtitleText>Subtitle Text ({getPlatformAdjustedSize(10)}px, Bold)</SubtitleText>
      <BodyText>Body Text ({getPlatformAdjustedSize(9)}px, Regular)</BodyText>
      <CaptionText>Caption Text ({getPlatformAdjustedSize(9)}px, Regular)</CaptionText>
      <SmallText>Small Text ({getPlatformAdjustedSize(9)}px, Regular)</SmallText>
      
      <ConsistentText variant="6xl" weight="semiBold">
        Large Heading ({getPlatformAdjustedSize(11)}px, Bold)
      </ConsistentText>
      
      <ConsistentText variant="base" weight="regular">
        Regular Text ({getPlatformAdjustedSize(9)}px, Regular)
      </ConsistentText>
      
      <ConsistentText variant="lg" weight="semiBold">
        Subheading ({getPlatformAdjustedSize(10)}px, Bold)
      </ConsistentText>
      
      <BodyText style={{ marginTop: 20 }}>
        Platform: {Platform.OS} - Text sizes are automatically adjusted for consistent rendering
      </BodyText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
  },
});
