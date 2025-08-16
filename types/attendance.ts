export interface Class {
    id: string;
    name: string;
}

export interface AttendanceRecord {
    id: string;
    student_id: string;
    class_id: string;
    date: string;
    arrival_time?: string;
    status: 'present' | 'late' | 'absent';
    late_minutes?: number;
    marked_by: string;
    created_at: string;
    students?: {
        full_name: string;
        roll_number: string;
        parent_contact?: string;
    };
}

export interface Student {
    id: string;
    full_name: string;
    roll_number: string;
    parent_contact: string;
    classes?: { name: string };
}

export interface AttendanceStats {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    attendanceRate: number;
}

export interface AttendanceSession {
    id: string;
    class_id: string;
    date: string;
    total_students: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    posted_at: string;
    classes?: { name: string };
}