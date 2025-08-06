export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'teacher' | 'student' | 'parent';
          contact_number?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: 'teacher' | 'student' | 'parent';
          contact_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'teacher' | 'student' | 'parent';
          contact_number?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          name: string;
          description?: string;
          teacher_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          teacher_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          teacher_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          full_name: string;
          roll_number: string;
          class_id: string;
          parent_contact: string;
          parent_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          roll_number: string;
          class_id: string;
          parent_contact: string;
          parent_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          roll_number?: string;
          class_id?: string;
          parent_contact?: string;
          parent_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          class_id: string;
          date: string;
          arrival_time: string;
          status: 'present' | 'late' | 'absent';
          late_minutes?: number;
          marked_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          class_id: string;
          date: string;
          arrival_time: string;
          status: 'present' | 'late' | 'absent';
          late_minutes?: number;
          marked_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          class_id?: string;
          date?: string;
          arrival_time?: string;
          status?: 'present' | 'late' | 'absent';
          late_minutes?: number;
          marked_by?: string;
          created_at?: string;
        };
      };
      lectures: {
        Row: {
          id: string;
          title: string;
          description?: string;
          file_url: string;
          file_type: string;
          class_id: string;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          file_url: string;
          file_type: string;
          class_id: string;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          file_url?: string;
          file_type?: string;
          class_id?: string;
          uploaded_by?: string;
          created_at?: string;
        };
      };
      diary_assignments: {
        Row: {
          id: string;
          title: string;
          description: string;
          due_date: string;
          file_url?: string;
          class_id?: string;
          student_id?: string;
          assigned_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          due_date: string;
          file_url?: string;
          class_id?: string;
          student_id?: string;
          assigned_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          due_date?: string;
          file_url?: string;
          class_id?: string;
          student_id?: string;
          assigned_by?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}