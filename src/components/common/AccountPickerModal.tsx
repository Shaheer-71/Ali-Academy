// src/components/common/AccountPickerModal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { User, ChevronRight, CheckCircle2, Circle, Trash2 } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';

interface AccountPickerModalProps {
  visible: boolean;
  accounts: string[];
  selectionMode: boolean;
  selectedForRemoval: string[];
  onPickAccount: (email: string) => void;
  onToggleSelectionMode: () => void;
  onToggleSelected: (email: string) => void;
  onRemoveSelected: () => void;
  onClose: () => void;
}

export const AccountPickerModal: React.FC<AccountPickerModalProps> = ({
  visible,
  accounts,
  selectionMode,
  selectedForRemoval,
  onPickAccount,
  onToggleSelectionMode,
  onToggleSelected,
  onRemoveSelected,
  onClose,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text allowFontScaling={false} style={styles.title}>Choose Account</Text>
            {accounts.length > 0 && (
              <TouchableOpacity onPress={onToggleSelectionMode}>
                <Text allowFontScaling={false} style={[styles.manageText, { color: selectionMode ? '#1F3F4A' : '#EF4444' }]}>
                  {selectionMode ? 'Cancel' : 'Remove'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={accounts}
            keyExtractor={item => item}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = selectedForRemoval.includes(item);
              return (
                <TouchableOpacity
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() => selectionMode ? onToggleSelected(item) : onPickAccount(item)}
                >
                  <View style={styles.avatar}>
                    <User size={16} color="#1F3F4A" />
                  </View>
                  <Text allowFontScaling={false} style={styles.email} numberOfLines={1}>{item}</Text>
                  {selectionMode ? (
                    isSelected
                      ? <CheckCircle2 size={20} color="#EF4444" />
                      : <Circle size={20} color="#9CA3AF" />
                  ) : (
                    <ChevronRight size={16} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              );
            }}
          />

          {selectionMode ? (
            <TouchableOpacity
              style={styles.footerButton}
              disabled={selectedForRemoval.length === 0}
              onPress={onRemoveSelected}
            >
              <Trash2 size={16} color={selectedForRemoval.length === 0 ? '#9CA3AF' : '#EF4444'} />
              <Text allowFontScaling={false} style={[styles.footerButtonText, { color: selectedForRemoval.length === 0 ? '#9CA3AF' : '#EF4444' }]}>
                {`Remove (${selectedForRemoval.length})`}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.footerButton} onPress={onClose}>
              <Text allowFontScaling={false} style={[styles.footerButtonText, { color: '#6B7280' }]}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 8,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: TextSizes.sectionTitle,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  manageText: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-SemiBold',
  },
  list: {
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(31,63,74,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  email: {
    flex: 1,
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  footerButtonText: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-SemiBold',
  },
});
