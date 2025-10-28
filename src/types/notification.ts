// src/types/notification.ts
export interface Notification {
    id: string;
    type: 'lecture_added' | 'quiz_added' | 'quiz_graded' | 'timetable_changed' | 'announcement' | 'assignment_added';
    title: string;
    message: string;
    entity_type?: string;
    entity_id?: string;
    created_by?: string;
    target_type: 'all_students' | 'all_teachers' | 'class' | 'individual' | 'role_based';
    target_id?: string;
    priority: 'low' | 'medium' | 'high';
    metadata?: Record<string, any>;
    created_at: string;
    // From notification_recipients
    is_read?: boolean;
    read_at?: string;
    creator?: {
        id: string;
        name: string;
        avatar_url?: string;
        role?: string;
    };
}

export interface NotificationRecipient {
    id: string;
    notification_id: string;
    user_id: string;
    is_read: boolean;
    read_at?: string;
    is_deleted: boolean;
    created_at: string;
}