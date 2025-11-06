import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: 'present' | 'late' | 'absent' | 'pending' | 'completed' | 'overdue';
  size?: 'small' | 'medium' | 'large';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'present':
        return {
          backgroundColor: '#DCFCE7',
          textColor: '#16A34A',
          text: 'PRESENT',
        };
      case 'late':
        return {
          backgroundColor: '#FEF3C7',
          textColor: '#D97706',
          text: 'LATE',
        };
      case 'absent':
        return {
          backgroundColor: '#FEE2E2',
          textColor: '#DC2626',
          text: 'ABSENT',
        };
      case 'pending':
        return {
          backgroundColor: '#E0E7FF',
          textColor: '#3730A3',
          text: 'PENDING',
        };
      case 'completed':
        return {
          backgroundColor: '#DCFCE7',
          textColor: '#16A34A',
          text: 'COMPLETED',
        };
      case 'overdue':
        return {
          backgroundColor: '#FEE2E2',
          textColor: '#DC2626',
          text: 'OVERDUE',
        };
      default:
        return {
          backgroundColor: '#F3F4F6',
          textColor: '#6B7280',
          text: 'UNKNOWN',
        };
    }
  };

  const config = getStatusConfig();
  const sizeStyles = {
    small: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 },
    medium: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 11 },
    large: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12 },
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: config.backgroundColor },
      {
        paddingHorizontal: sizeStyles[size].paddingHorizontal,
        paddingVertical: sizeStyles[size].paddingVertical,
      }
    ]}>
      <Text allowFontScaling={false} style={[
        styles.text,
        { color: config.textColor, fontSize: sizeStyles[size].fontSize }
      ]}>
        {config.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Inter-SemiBold',
  },
});