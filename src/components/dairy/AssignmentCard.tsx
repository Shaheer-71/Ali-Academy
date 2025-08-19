import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NotebookPen, Calendar, Clock, Users, User, FileText, TriangleAlert as AlertTriangle } from 'lucide-react-native';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  file_url?: string;
  class_id?: string;
  student_id?: string;
  created_at: string;
  classes?: { name: string };
  students?: { full_name: string };
}

interface AssignmentCardProps {
  assignment: Assignment;
  onPress?: () => void;
  onViewAttachment?: () => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onPress,
  onViewAttachment,
}) => {
  const isOverdue = () => {
    return new Date(assignment.due_date) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilDue = () => {
    const today = new Date();
    const dueDate = new Date(assignment.due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  const overdue = isOverdue();

  return (
    <TouchableOpacity 
      style={[styles.container, overdue && styles.overdueContainer]} 
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, overdue && styles.overdueIconContainer]}>
          <NotebookPen size={20} color={overdue ? "#EF4444" : "#274d71"} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {assignment.title}
          </Text>
          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Calendar size={12} color="#6B7280" />
              <Text style={[styles.metadataText, overdue && styles.overdueText]}>
                Due: {formatDate(assignment.due_date)}
              </Text>
            </View>
            {assignment.class_id ? (
              <View style={styles.metadataItem}>
                <Users size={12} color="#6B7280" />
                <Text style={styles.metadataText}>{assignment.classes?.name}</Text>
              </View>
            ) : (
              <View style={styles.metadataItem}>
                <User size={12} color="#6B7280" />
                <Text style={styles.metadataText}>{assignment.students?.full_name}</Text>
              </View>
            )}
          </View>
        </View>
        {overdue && (
          <View style={styles.overdueIndicator}>
            <AlertTriangle size={16} color="#EF4444" />
          </View>
        )}
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {assignment.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.dueInfo}>
          <Clock size={14} color={overdue ? "#EF4444" : "#6B7280"} />
          <Text style={[styles.dueText, overdue && styles.overdueText]}>
            {getDaysUntilDue()}
          </Text>
        </View>

        {assignment.file_url && (
          <TouchableOpacity style={styles.attachmentButton} onPress={onViewAttachment}>
            <FileText size={14} color="#274d71" />
            <Text style={styles.attachmentText}>Attachment</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

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
  overdueContainer: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  overdueIconContainer: {
    backgroundColor: '#FEE2E2',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 6,
  },
  metadata: {
    gap: 4,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  overdueText: {
    color: '#EF4444',
    fontFamily: 'Inter-Medium',
  },
  overdueIndicator: {
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 4,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  attachmentText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#274d71',
  },
});