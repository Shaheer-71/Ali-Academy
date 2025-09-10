// src/types/lecture.types.ts

export interface Lecture {
    id: string;
    title: string;
    description?: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size?: number;
    youtube_link?: string;
    class_id: string;
    subject_id: string;
    uploaded_by: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;

    // Relations
    classes?: { name: string };
    subjects?: { name: string };
    profiles?: { full_name: string };

    // View tracking
    has_viewed?: boolean;
    has_downloaded?: boolean;
}

export interface LectureAccess {
    id: string;
    lecture_id: string;
    user_id?: string;
    class_id?: string;
    access_type: 'class' | 'individual';
    granted_by: string;
    created_at: string;
}

export interface LectureFormData {
    title: string;
    description: string;
    file: any;
    youtube_link: string;
    class_id: string;
    subject_id: string;
    access_type: 'class' | 'individual';
    selected_students: string[];
}

export interface Class {
    id: string;
    name: string;
    teacher_id: string;
}

export interface Subject {
    id: string;
    name: string;
    is_active: boolean;
}

export interface Student {
    id: string;
    user_id: string;
    class_id: string;
    roll_number?: string;
    profiles?: {
        full_name: string;
        email?: string;
    };
}