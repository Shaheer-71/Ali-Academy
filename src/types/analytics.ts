export interface StudentAnalytics {
    attendance_rate: number;
    average_grade: number;
    assignments_completed: number;
    total_assignments: number;
    rank_in_class: number;
    total_students: number;
    improvement_trend: 'up' | 'down' | 'stable';
    recent_grades: number[];
    subjects: {
        name: string;
        grade: number;
        assignments_completed: number;
        total_assignments: number;
    }[];
}

export interface QuizResult {
    percentage: number | null;
    marks_obtained: number | null;
    total_marks: number;
    created_at: string;
    quizzes: {
        title: string;
        subject_id: string;
        class_id: string;
        subjects: {
            name: string;
        }; // Changed from array to single object
    } | null; // Made nullable for safety
}

export interface Student {
    id: string;
    full_name: string;
    class_id: string;
    email: string;
    classes: {
        id: string;
        name: string;
    };
}
export interface Subject {
    id: string;
    name: string;
    // class_id: string;
}

interface SupabaseQuizResult {
    percentage: number | null;
    marks_obtained: number | null;
    total_marks: number;
    created_at: string;
    quizzes: {
        title: string;
        subject_id: string;
        class_id: string;
        subjects: {
            name: string;
        }; // Single object, not array
    };
}



export interface StudentPerformance {
    id: string;
    full_name: string;
    roll_number: string;
    attendance_rate: number;
    average_grade: number;
    assignments_completed: number;
    total_assignments: number;
    class_name: string;
}

export interface ClassAnalytics {
    class_id: string;
    class_name: string;
    total_students: number;
    average_attendance: number;
    average_grade: number;
    top_performer: string;
}

export interface Student {
    id: string;
    full_name: string;
    roll_number: string | null;
    class_id: string;
    classes: {
        id: string;
        name: string;
    };
}

export interface Class {
    id: string;
    name: string;
    description: string | null;
    teacher_id: string;
}


export interface StudentPerformance {
    id: string;
    full_name: string;
    roll_number: string;
    attendance_rate: number;
    average_grade: number;
    assignments_completed: number;
    total_assignments: number;
    class_name: string;
}

export interface ClassAnalytics {
    class_id: string;
    class_name: string;
    total_students: number;
    average_attendance: number;
    average_grade: number;
    top_performer: string;
}


export interface Class {
    id: string;
    name: string;
    description: string | null;
    teacher_id: string;
}