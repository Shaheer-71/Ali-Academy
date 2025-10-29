import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { Bell, Menu, DollarSign } from 'lucide-react-native';
import { TitleText, CaptionText, SmallText } from '../ConsistentText';

interface HeaderProps {
  title: string;
  showNotifications?: boolean;
  onMenuPress?: () => void;
  rightComponent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showNotifications = true,
  onMenuPress,
  rightComponent,
}) => {
  const { profile } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {onMenuPress && (
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <Menu size={24} color="#274d71" />
          </TouchableOpacity>
        )}
        <View>
          <TitleText>{title}</TitleText>
          <CaptionText color="#6B7280" style={{ marginTop: 2 }}>{profile?.full_name}</CaptionText>
        </View>
      </View>

      <View style={styles.rightSection}>
        {rightComponent || (
          showNotifications && (
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={20} color="#274d71" />
              <View style={styles.notificationBadge}>
                <SmallText color="#ffffff">3</SmallText>
              </View>
            </TouchableOpacity>
          )
        )}
      </View>

      <View style={styles.leftSection}>
        {onMenuPress && (
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <Menu size={24} color="#274d71" />
          </TouchableOpacity>
        )}
        <View>
          <TitleText>{title}</TitleText>
          <CaptionText color="#6B7280" style={{ marginTop: 2 }}>{profile?.full_name}</CaptionText>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  // Text styles are now handled by ConsistentText components
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Text styles are now handled by ConsistentText components
});