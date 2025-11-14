import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Hash, BookOpen, Phone, MoveVertical as MoreVertical } from 'lucide-react-native';

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  parent_contact: string;
  classes?: { name: string };
}

interface StudentCardProps {
  student: Student;
  onPress?: () => void;
  onMenuPress?: () => void;
  showActions?: boolean;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onPress,
  onMenuPress,
  showActions = false,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text allowFontScaling={false} style={styles.initial}>
            {student.full_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text allowFontScaling={false} style={styles.name}>{student.full_name}</Text>
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Hash size={12} color="#6B7280" />
              <Text allowFontScaling={false} style={styles.detailText}>{student.roll_number}</Text>
            </View>
            <View style={styles.detailItem}>
              <BookOpen size={12} color="#6B7280" />
              <Text allowFontScaling={false} style={styles.detailText}>{student.classes?.name}</Text>
            </View>
          </View>
        </View>
        {showActions && onMenuPress && (
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <MoreVertical size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.contact}>
        <Phone size={14} color="#6B7280" />
        <Text allowFontScaling={false} style={styles.contactText}>{student.parent_contact}</Text>
      </View>
    </TouchableOpacity>
  );
};


import { TextSizes } from '@/src/styles/TextSizes';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#274d71',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initial: {
    fontSize: TextSizes.large,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: TextSizes.large,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  details: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: TextSizes.normal,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  menuButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  contactText: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 6,
  },
});


// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 8,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     backgroundColor: '#274d71',
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   initial: {
//     fontSize: 16,
//     fontFamily: 'Inter-SemiBold',
//     color: '#ffffff',
//   },
//   info: {
//     flex: 1,
//   },
//   name: {
//     fontSize: 16,
//     fontFamily: 'Inter-SemiBold',
//     color: '#111827',
//     marginBottom: 4,
//   },
//   details: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   detailText: {
//     fontSize: 12,
//     fontFamily: 'Inter-Regular',
//     color: '#6B7280',
//     marginLeft: 4,
//   },
//   menuButton: {
//     width: 32,
//     height: 32,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   contact: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: '#F3F4F6',
//   },
//   contactText: {
//     fontSize: 14,
//     fontFamily: 'Inter-Medium',
//     color: '#374151',
//     marginLeft: 6,
//   },
// });