// hooks/useAttendance.ts
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
  students?: {
    full_name: string;
    roll_number: string;
    parent_contact: string;
  };
  created_at: string;
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
  const [todaysAttendance, setTodaysAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { profile } = useAuth();

  // Clear all data when classId changes
  useEffect(() => {
    if (profile?.role === 'teacher') {
      setStudents([]);
      setAttendanceRecords([]);
      setAttendanceSessions([]);
      setCurrentAttendance({});
      setTodaysAttendance({});
      setAttendanceStats({
        totalDays: 0,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        attendanceRate: 0,
      });
      
      if (classId) {
        setLoading(true);
        fetchStudents();
        fetchAttendanceData();
        fetchTodaysAttendance(new Date().toISOString().split('T')[0]);
      }
    } else if (profile?.role === 'student') {
      setAttendanceRecords([]);
      setAttendanceStats({
        totalDays: 0,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        attendanceRate: 0,
      });
      fetchStudentAttendance();
    }
  }, [classId, profile]);

  const fetchStudents = async () => {
    if (!classId) {
      setStudents([]);
      setLoading(false);
      return;
    }
    
    try {
      console.log('Fetching students for class:', classId);
      
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
      
      console.log('Fetched students:', data);
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchTodaysAttendance = async (date: string) => {
    if (!classId) {
      setTodaysAttendance({});
      return;
    }

    try {
      console.log('Fetching attendance for date:', date, 'class:', classId);
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          students (
            full_name,
            roll_number,
            parent_contact
          )
        `)
        .eq('class_id', classId)
        .eq('date', date);

      if (error) throw error;

      console.log('Found attendance records:', data);

      // Convert array to object with student_id as key for easy lookup
      const todaysRecords: Record<string, AttendanceRecord> = {};
      data?.forEach(record => {
        todaysRecords[record.student_id] = record;
      });

      setTodaysAttendance(todaysRecords);
      console.log('Todays attendance set:', todaysRecords);
    } catch (error) {
      console.error('Error fetching todays attendance:', error);
      setTodaysAttendance({});
    }
  };

  const fetchAttendanceData = async (startDate?: string, endDate?: string) => {
    if (!classId && profile?.role === 'teacher') {
      setAttendanceRecords([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
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

      if (classId && profile?.role === 'teacher') {
        query = query.eq('class_id', classId);
      }

      if (profile?.role === 'student') {
        query = query.eq('student_id', profile.id);
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

      // Fetch attendance sessions for teachers
      if (profile?.role === 'teacher' && classId) {
        await fetchAttendanceSessions(startDate, endDate);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAttendanceRecords([]);
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
    if (!classId) {
      setAttendanceSessions([]);
      return;
    }
    
    try {
      let query = supabase
        .from('attendance_sessions')
        .select(`
          *,
          classes (name)
        `)
        .eq('class_id', classId)
        .order('date', { ascending: false });

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
      setAttendanceSessions([]);
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
    arrivalTime?: string
  ) => {
    const currentTime = arrivalTime || new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
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
        student_id: record.student_id,
        class_id: record.class_id,
        date: date,
        arrival_time: record.arrival_time,
        status: record.status,
        late_minutes: record.late_minutes,
        marked_by: profile!.id,
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceData, { onConflict: 'student_id,date' });

      if (error) throw error;

      // Clear current attendance after posting
      setCurrentAttendance({});
      
      // Refresh today's attendance and other data
      await Promise.all([
        onRefresh(),
        fetchTodaysAttendance(date)
      ]);
      
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
      const cleanUpdates = {
        status: updates.status,
        arrival_time: updates.arrival_time,
        late_minutes: updates.late_minutes,
      };

      const { error } = await supabase
        .from('attendance')
        .update(cleanUpdates)
        .eq('id', attendanceId);

      if (error) throw error;

      // Refresh data including today's attendance
      await Promise.all([
        onRefresh(),
        fetchTodaysAttendance(new Date().toISOString().split('T')[0])
      ]);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating attendance:', error);
      return { success: false, error };
    }
  };

  // Comprehensive refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    setLoading(true);
    
    try {
      if (profile?.role === 'teacher' && classId) {
        // Clear all data first
        setStudents([]);
        setAttendanceRecords([]);
        setAttendanceSessions([]);
        setCurrentAttendance({});
        setTodaysAttendance({});
        
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch fresh data in parallel
        await Promise.all([
          fetchStudents(),
          fetchAttendanceSessions(),
          fetchTodaysAttendance(today),
        ]);
        
        // Fetch fresh attendance data with recalculation
        const { data: freshAttendanceData, error } = await supabase
          .from('attendance')
          .select(`
            *,
            students (
              full_name,
              roll_number,
              parent_contact
            )
          `)
          .eq('class_id', classId)
          .order('date', { ascending: false });

        if (!error && freshAttendanceData) {
          setAttendanceRecords(freshAttendanceData);
          calculateStats(freshAttendanceData);
        }

      } else if (profile?.role === 'student') {
        // Clear student data first
        setAttendanceRecords([]);
        
        // Refresh all student data
        const { data: studentAttendanceData, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', profile.id)
          .order('date', { ascending: false });

        if (!error && studentAttendanceData) {
          setAttendanceRecords(studentAttendanceData);
          calculateStats(studentAttendanceData);
        }
      }
      
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const clearCurrentAttendance = () => {
    setCurrentAttendance({});
  };

  const clearAllData = () => {
    setStudents([]);
    setAttendanceRecords([]);
    setAttendanceSessions([]);
    setCurrentAttendance({});
    setTodaysAttendance({});
    setAttendanceStats({
      totalDays: 0,
      presentDays: 0,
      lateDays: 0,
      absentDays: 0,
      attendanceRate: 0,
    });
  };

  // Check if student has attendance marked for specific date
  const isStudentMarkedForDate = (studentId: string, date: string) => {
    const isMarked = !!todaysAttendance[studentId];
    console.log(`Student ${studentId} marked for ${date}:`, isMarked);
    return isMarked;
  };

  // Get student's attendance record for specific date
  const getStudentRecordForDate = (studentId: string, date: string) => {
    return todaysAttendance[studentId] || null;
  };

  const checkAttendanceForDate = async (date: string) => {
    if (!classId) return [];
    
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          students (
            full_name,
            roll_number,
            parent_contact
          )
        `)
        .eq('class_id', classId)
        .eq('date', date);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error checking attendance for date:', error);
      return [];
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
    todaysAttendance,
    loading,
    posting,
    refreshing,
    markStudentAttendance,
    postAttendance,
    updateAttendance,
    fetchAttendanceData,
    fetchTodaysAttendance,
    onRefresh,
    clearCurrentAttendance,
    clearAllData,
    isStudentMarkedForDate,
    getStudentRecordForDate,
    checkAttendanceForDate,
    getAttendanceForDateRange,
    getStudentAttendanceStats,
    getClassAttendanceForDate,
    refetch: onRefresh,
  };
};