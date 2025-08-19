// types/timetable.ts - UPDATED WITHOUT ADMIN ROLE

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

// UserProfile interface (your existing auth context type)
export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: 'teacher' | 'student' | 'parent';
    avatar_url?: string;
}

// Database Profile type (matches your Supabase schema)
export interface Profile extends UserProfile {
    created_at: string;
    updated_at: string;
}

// Database Class type
export interface Class {
    id: string;
    name: string;
    created_at?: string;
    updated_at?: string;
}

// Database Subject type
export interface Subject {
    id: string;
    name: string;
    created_at?: string;
    updated_at?: string;
}

// Raw timetable entry from database
export interface TimetableEntry {
    id: string;
    day: DayOfWeek;
    start_time: string; // Format: "HH:MM:SS"
    end_time: string;   // Format: "HH:MM:SS"
    subject_id: string;
    room_number: string;
    class_id: string;
    teacher_id: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    created_by?: string;
    updated_by?: string;
    deleted_by?: string;
}

// Timetable view entry with joined data (matches your timetable_view)
export interface TimetableEntryWithDetails extends TimetableEntry {
    subject_name: string;   // From subjects table
    class_name: string;     // From classes table
    teacher_name: string;   // From profiles table
    teacher_avatar?: string; // From profiles table
}

export interface CreateTimetableEntry {
    day: DayOfWeek;
    start_time: string;
    end_time: string;
    subject: string; // This should be subject_id in the API call
    room_number: string;
    class_id: string;
    teacher_id: string;
}

export interface UpdateTimetableEntry {
    id: string;
    day?: DayOfWeek;
    start_time?: string;
    end_time?: string;
    subject?: string; // This should be subject_id in the API call
    room_number?: string;
    class_id?: string;
    teacher_id?: string;
}

export interface TimetableFilters {
    class_id?: string;
    teacher_id?: string;
    day?: DayOfWeek;
    search_query?: string;
}

export interface TimetableConflict {
    existing_entry: TimetableEntryWithDetails;
    conflicting_time: {
        start: string;
        end: string;
    };
}

export interface TimetableValidation {
    is_valid: boolean;
    conflicts: TimetableConflict[];
    errors: string[];
}

// Theme colors interface
export interface ThemeColors {
    background: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    cardBackground: string;
    secondary: string;
    error: string;
}

export interface UseTimetableReturn {
    // Data
    timetable: TimetableEntryWithDetails[];
    loading: boolean;
    error: string | null;

    // Filters
    filters: TimetableFilters;
    setFilters: (filters: Partial<TimetableFilters>) => void;

    // CRUD Operations
    createEntry: (entry: CreateTimetableEntry) => Promise<TimetableEntryWithDetails | null>;
    updateEntry: (entry: UpdateTimetableEntry) => Promise<TimetableEntryWithDetails | null>;
    deleteEntry: (id: string) => Promise<boolean>;

    // Utility functions
    getEntriesForDay: (day: DayOfWeek) => TimetableEntryWithDetails[];
    getEntriesForClass: (class_id: string) => TimetableEntryWithDetails[];
    getEntriesForTeacher: (teacher_id: string) => TimetableEntryWithDetails[];
    validateEntry: (entry: CreateTimetableEntry | UpdateTimetableEntry) => Promise<TimetableValidation>;

    // Real-time updates
    refreshTimetable: () => Promise<void>;
}

export interface TimetableContextType extends UseTimetableReturn {
    // Additional context-specific methods
    subscribe: (callback: (timetable: TimetableEntryWithDetails[]) => void) => () => void;
    unsubscribe: () => void;
}

// Enums for better type safety
export enum TimetableDay {
    MONDAY = 'Monday',
    TUESDAY = 'Tuesday',
    WEDNESDAY = 'Wednesday',
    THURSDAY = 'Thursday',
    FRIDAY = 'Friday',
    SATURDAY = 'Saturday'
}

export const DAYS_ORDER: DayOfWeek[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

export const DAYS_SHORT: Record<DayOfWeek, string> = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat'
};

// Time utilities
export interface TimeSlot {
    start: string;
    end: string;
    duration: number; // in minutes
}

export interface DaySchedule {
    day: DayOfWeek;
    entries: TimetableEntryWithDetails[];
    total_hours: number;
    free_slots: TimeSlot[];
}

export interface WeekSchedule {
    week_start: Date;
    week_end: Date;
    days: DaySchedule[];
    total_classes: number;
    total_hours: number;
}

// API Response types
export interface TimetableApiResponse {
    data: TimetableEntryWithDetails[] | null;
    error: any;
    count?: number;
}

export interface TimetableOperationResponse {
    data: TimetableEntryWithDetails | null;
    error: any;
    success: boolean;
    message?: string;
}