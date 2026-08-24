// src/utils/tabTransitions.ts
import { Dimensions, Easing } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Directional slide between tabs: a tab to the right of the current one
 * slides in from the right (and the outgoing screen slides out left), and
 * vice versa for a tab to the left — mirrors a standard stack push/pop feel
 * applied to bottom-tab switches.
 */
export const tabSlideTransition: Pick<BottomTabNavigationOptions, 'transitionSpec' | 'sceneStyleInterpolator'> = {
  transitionSpec: {
    animation: 'timing',
    config: {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    },
  },
  sceneStyleInterpolator: ({ current }) => ({
    sceneStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          }),
        },
      ],
    },
  }),
};
