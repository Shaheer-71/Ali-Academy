// hooks/useStudents.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  email?: string; // Added email field
  phone_number?: string; // Added phone field
  class_id: string;
  parent_contact: string;
  parent_id?: string;
  gender?: 'male' | 'female' | 'other'; // Added gender
  address?: string; // Added address
  student_status?: string; // Added status
  admission_date?: string; // Added admission date
  created_at: string;
  updated_at: string;
  is_deleted?: boolean; // Added soft delete
  classes?: {
    id: string;
    name: string;
  };
}

export const useStudents = (classId?: string) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    fetchStudents();
  }, [classId, profile]);

  const fetchStudents = async () => {
    try {
      let query = supabase
        .from('students')
        .select(`
          *,
          classes (
            id,
            name
          )
        `)
        .eq('is_deleted', false) // Only get non-deleted students
        .order('roll_number');

      if (classId) {
        query = query.eq('class_id', classId);
      }

      // Filter based on user role
      if (profile?.role === 'parent') {
        query = query.eq('parent_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (studentData: {
    full_name: string;
    roll_number: string;
    class_id: string;
    parent_contact: string;
    parent_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([studentData])
        .select()
        .single();

      if (error) throw error;

      await fetchStudents();
      return { success: true, data };
    } catch (error) {
      console.error('Error adding student:', error);
      return { success: false, error };
    }
  };

  const updateStudent = async (studentId: string, updates: Partial<Student>) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .update({
          ...updates,
          updated_by: profile?.id // Add audit trail
        })
        .eq('id', studentId)
        .eq('is_deleted', false) // Only update non-deleted students
        .select()
        .single();

      if (error) throw error;

      await fetchStudents();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating student:', error);
      return { success: false, error };
    }
  };

  const deleteStudent = async (studentId: string) => {
    try {
      // Soft delete instead of hard delete
      const { error } = await supabase
        .from('students')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: profile?.id
        })
        .eq('id', studentId);

      if (error) throw error;

      await fetchStudents();
      return { success: true };
    } catch (error) {
      console.error('Error deleting student:', error);
      return { success: false, error };
    }
  };

  const searchStudents = (query: string) => {
    if (!query.trim()) return students;

    const lowercaseQuery = query.toLowerCase();
    return students.filter(student =>
      student.full_name.toLowerCase().includes(lowercaseQuery) ||
      student.roll_number.toLowerCase().includes(lowercaseQuery) ||
      student.email?.toLowerCase().includes(lowercaseQuery) ||
      student.classes?.name.toLowerCase().includes(lowercaseQuery)
    );
  };

  return {
    students,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    searchStudents,
    refetch: fetchStudents,
  };
};