// src/services/notificationService.ts
import { supabase } from "../lib/supabase";

export class NotificationService {
    static async createNotification(data: {
        type: string;
        title: string;
        message: string;
        targetType: string;
        targetId?: string;
        entityType?: string;
        entityId?: string;
        priority?: string;
    }) {
        try {
            // Create the notification
            const { data: notification, error: notifError } = await supabase
                .from('notifications')
                .insert({
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    target_type: data.targetType,
                    target_id: data.targetId,
                    entity_type: data.entityType,
                    entity_id: data.entityId,
                    priority: data.priority || 'medium',
                    created_by: (await supabase.auth.getUser()).data.user?.id,
                })
                .select()
                .single();

            if (notifError) throw notifError;

            // Get target users based on target_type
            let targetUsers: string[] = [];

            switch (data.targetType) {
                case 'all_students':
                    const { data: students } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('role', 'student');
                    targetUsers = students?.map(s => s.id) || [];
                    break;

                case 'all_teachers':
                    const { data: teachers } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('role', 'teacher');
                    targetUsers = teachers?.map(t => t.id) || [];
                    break;

                case 'class':
                    if (data.targetId) {
                        const { data: classStudents } = await supabase
                            .from('class_enrollments')
                            .select('user_id')
                            .eq('class_id', data.targetId);
                        targetUsers = classStudents?.map(cs => cs.user_id) || [];
                    }
                    break;

                case 'individual':
                    if (data.targetId) {
                        targetUsers = [data.targetId];
                    }
                    break;
            }

            // Create recipient records
            if (targetUsers.length > 0) {
                const recipients = targetUsers.map(userId => ({
                    notification_id: notification.id,
                    user_id: userId,
                }));

                const { error: recipientError } = await supabase
                    .from('notification_recipients')
                    .insert(recipients);

                if (recipientError) throw recipientError;
            }

            return { success: true, notification };
        } catch (error) {
            console.warn('Failed to create notification:', error);
            return { success: false, error };
        }
    }

    static async sendAnnouncementToClass(
        classId: string,
        title: string,
        message: string
    ) {
        return this.createNotification({
            type: 'announcement',
            title,
            message,
            targetType: 'class',
            targetId: classId,
            priority: 'high',
        });
    }

    static async notifyQuizGraded(
        studentId: string,
        quizId: string,
        quizTitle: string,
        score: number
    ) {
        return this.createNotification({
            type: 'quiz_graded',
            title: 'Quiz Graded',
            message: `Your quiz "${quizTitle}" has been graded. Score: ${score}%`,
            targetType: 'individual',
            targetId: studentId,
            entityType: 'quiz',
            entityId: quizId,
            priority: 'medium',
        });
    }

    static async notifyLectureAdded(classId: string, lectureTitle: string, lectureId: string) {
        return this.createNotification({
            type: 'lecture_added',
            title: 'New Lecture Available',
            message: `"${lectureTitle}" has been uploaded to your class`,
            targetType: 'class',
            targetId: classId,
            entityType: 'lecture',
            entityId: lectureId,
            priority: 'medium',
        });
    }
}