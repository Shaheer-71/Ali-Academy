import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  arrival_time?: string;
  status: 'present' | 'late' | 'absent';
  late_minutes?: number;
  notes?: string;
  students?: {
    full_name: string;
    roll_number: string;
    parent_contact: string;
  };
  created_at: string;
  updated_at: string;
}

interface AttendanceSession {
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

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  attendanceRate: number;
}

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  parent_contact: string;
  classes?: { name: string };
}

export const useAttendance = (classId?: string) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    attendanceRate: 0,
  });
  const [currentAttendance, setCurrentAttendance] = useState<Record<string, Partial<AttendanceRecord>>>({});
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.role === 'teacher' && classId) {
      fetchStudents();
      fetchAttendanceData();
    } else if (profile?.role === 'student') {
      fetchStudentAttendance();
    }
  }, [classId, profile]);

  const fetchStudents = async () => {
    if (!classId) return;
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          roll_number,
          parent_contact,
          classes (name)
        `)
        .eq('class_id', classId)
        .eq('is_deleted', false)
        .order('roll_number');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAttendanceData = async (startDate?: string, endDate?: string) => {
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          students (
            full_name,
            roll_number,
            parent_contact
          )
        `)
        .order('date', { ascending: false });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      setAttendanceRecords(data || []);
      calculateStats(data || []);

      // Fetch attendance sessions
      await fetchAttendanceSessions(startDate, endDate);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAttendance = async (startDate?: string, endDate?: string) => {
    try {
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('student_id', profile?.id)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      setAttendanceRecords(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching student attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceSessions = async (startDate?: string, endDate?: string) => {
    try {
      let query = supabase
        .from('attendance_sessions')
        .select(`
          *,
          classes (name)
        `)
        .order('date', { ascending: false });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      setAttendanceSessions(data || []);
    } catch (error) {
      console.error('Error fetching attendance sessions:', error);
    }
  };

  const calculateStats = (records: AttendanceRecord[]) => {
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

    setAttendanceStats({
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      attendanceRate,
    });
  };

  const markStudentAttendance = (
    studentId: string,
    status: 'present' | 'late' | 'absent',
    arrivalTime?: string,
    notes?: string
  ) => {
    const currentTime = arrivalTime || new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    // Calculate if late (assuming class starts at 16:00)
    let finalStatus = status;
    let lateMinutes = 0;

    if (status === 'present' && arrivalTime) {
      const [hours, minutes] = arrivalTime.split(':').map(Number);
      const arrivalTotalMinutes = hours * 60 + minutes;
      const classStartMinutes = 16 * 60; // 4:00 PM
      const cutoffMinutes = 16 * 60 + 15; // 4:15 PM

      if (arrivalTotalMinutes > cutoffMinutes) {
        finalStatus = 'late';
        lateMinutes = arrivalTotalMinutes - classStartMinutes;
      }
    }

    setCurrentAttendance(prev => ({
      ...prev,
      [studentId]: {
        student_id: studentId,
        class_id: classId!,
        date: new Date().toISOString().split('T')[0],
        arrival_time: currentTime,
        status: finalStatus,
        late_minutes: lateMinutes > 0 ? lateMinutes : undefined,
        notes,
      }
    }));
  };

  const postAttendance = async (date: string = new Date().toISOString().split('T')[0]) => {
    if (!classId || Object.keys(currentAttendance).length === 0) {
      throw new Error('No attendance data to post');
    }

    setPosting(true);
    try {
      const attendanceData = Object.values(currentAttendance).map(record => ({
        ...record,
        date,
        marked_by: profile!.id,
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceData, { onConflict: 'student_id,date' });

      if (error) throw error;

      // Clear current attendance after posting
      setCurrentAttendance({});
      
      // Refresh data
      await fetchAttendanceData();
      
      return { success: true };
    } catch (error) {
      console.error('Error posting attendance:', error);
      return { success: false, error };
    } finally {
      setPosting(false);
    }
  };

  const updateAttendance = async (
    attendanceId: string,
    updates: Partial<AttendanceRecord>
  ) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attendanceId);

      if (error) throw error;

      await fetchAttendanceData();
      return { success: true };
    } catch (error) {
      console.error('Error updating attendance:', error);
      return { success: false, error };
    }
  };

  const getAttendanceForDateRange = (startDate: string, endDate: string) => {
    return attendanceRecords.filter(record => 
      record.date >= startDate && record.date <= endDate
    );
  };

  const getStudentAttendanceStats = (studentId: string, startDate?: string, endDate?: string) => {
    let records = attendanceRecords.filter(r => r.student_id === studentId);
    
    if (startDate) {
      records = records.filter(r => r.date >= startDate);
    }
    
    if (endDate) {
      records = records.filter(r => r.date <= endDate);
    }

    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

    return {
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      attendanceRate,
    };
  };

  const getClassAttendanceForDate = (date: string) => {
    return attendanceRecords.filter(record => record.date === date);
  };

  return {
    students,
    attendanceRecords,
    attendanceSessions,
    attendanceStats,
    currentAttendance,
    loading,
    posting,
    markStudentAttendance,
    postAttendance,
    updateAttendance,
    fetchAttendanceData,
    getAttendanceForDateRange,
    getStudentAttendanceStats,
    getClassAttendanceForDate,
    refetch: () => fetchAttendanceData(),
  };
};