// hooks/useAttendance.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { sendPushNotification } from '../lib/notifications';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  subject_id: string; // ✅ Added
  teacher_id: string; // ✅ Added
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
  subject_id: string; // ✅ Added
  teacher_id: string; // ✅ Added
  date: string;
  total_students: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  posted_at: string;
  classes?: { name: string };
  subjects?: { name: string }; // ✅ Added
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

export const useAttendance = (classId?: string, subjectId?: string) => { // ✅ Added subjectId parameter
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

  // Clear all data when classId or subjectId changes
  useEffect(() => {
    if ((profile?.role === 'teacher' || profile?.role === 'admin')) {
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

      if (classId && subjectId) { // ✅ Require both class and subject
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
  }, [classId, subjectId, profile]); // ✅ Added subjectId dependency

  const fetchStudents = async () => {
    if (!classId || !subjectId) { // ✅ Require both
      setStudents([]);
      setLoading(false);
      return;
    }

    try {

      // ✅ Get students enrolled in this specific class + subject
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_subject_enrollments')
        .select('student_id')
        .eq('class_id', classId)
        .eq('subject_id', subjectId)
        .eq('is_active', true);

      if (enrollmentError) {
        console.error('Enrollments fetch error:', enrollmentError);
        throw new Error('Failed to fetch enrollments: ' + enrollmentError.message);
      }

      if (!enrollments || enrollments.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = [...new Set(enrollments.map(e => e.student_id))];

      // Fetch student details
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          roll_number,
          parent_contact,
          classes (name)
        `)
        .in('id', studentIds)
        .eq('is_deleted', false)
        .order('roll_number');

      if (error) throw error;

      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysAttendance = async (date: string) => {
    if (!classId || !subjectId) { // ✅ Require both
      setTodaysAttendance({});
      return;
    }

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
        .eq('subject_id', subjectId) // ✅ Filter by subject
        .eq('date', date);

      if (error) throw error;

      // Convert array to object with student_id as key for easy lookup
      const todaysRecords: Record<string, AttendanceRecord> = {};
      data?.forEach(record => {
        todaysRecords[record.student_id] = record;
      });

      setTodaysAttendance(todaysRecords);
    } catch (error) {
      console.error('Error fetching todays attendance:', error);
      setTodaysAttendance({});
    }
  };

  const fetchAttendanceData = async (startDate?: string, endDate?: string) => {
    if (profile?.role === 'student') {
      // For students, fetch their own attendance
      return fetchStudentAttendance(startDate, endDate);
    }

    if (!classId) {
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
          ),
          subjects (name)
        `)
        .eq('class_id', classId)
        .order('date', { ascending: false });

      // ✅ If subject is specified, filter by it
      if (subjectId) {
        query = query.eq('subject_id', subjectId);
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
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAttendance = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);

      let query = supabase
        .from('attendance')
        .select(`
          *,
          subjects (name),
          classes (name)
        `)
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
          classes (name),
          subjects (name)
        `)
        .eq('class_id', classId)
        .order('date', { ascending: false });

      // ✅ If subject is specified, filter by it
      if (subjectId) {
        query = query.eq('subject_id', subjectId);
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
        subject_id: subjectId!, // ✅ Added
        teacher_id: profile!.id, // ✅ Added
        date: new Date().toISOString().split('T')[0],
        arrival_time: currentTime,
        status: finalStatus,
        late_minutes: lateMinutes > 0 ? lateMinutes : undefined,
      }
    }));
  };

  const postAttendance = async (date: string = new Date().toISOString().split('T')[0]) => {
    if (!classId || !subjectId || Object.keys(currentAttendance).length === 0) {
      throw new Error('No attendance data to post');
    }

    setPosting(true);

    try {

      const attendanceData = Object.values(currentAttendance).map(record => ({
        student_id: record.student_id,
        class_id: record.class_id,
        subject_id: record.subject_id, // ✅ Added
        teacher_id: record.teacher_id, // ✅ Added
        date,
        arrival_time: record.arrival_time,
        status: record.status,
        late_minutes: record.late_minutes,
        marked_by: profile!.id,
      }));


      // ✅ Check if attendance already exists for this class + subject + date
      const { data: existing, error: checkError } = await supabase
        .from('attendance')
        .select('id')
        .eq('class_id', classId)
        .eq('subject_id', subjectId)
        .eq('date', date)
        .limit(1);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        throw new Error('Attendance already posted for this subject today');
      }

      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert(attendanceData);

      if (attendanceError) throw attendanceError;


      // Clear current attendance after successful post
      setCurrentAttendance({});

      // Refresh data
      await fetchTodaysAttendance(date);
      await fetchAttendanceData();

      // Send notifications for late/absent students
      const affectedStudents = attendanceData.filter(
        r => r.status === 'late' || r.status === 'absent'
      );

      for (const record of affectedStudents) {
        const notificationPayload = {
          type: 'attendance_alert',
          title: record.status === 'late' ? 'Late Attendance Alert' : 'Absence Alert',
          message:
            record.status === 'late'
              ? `You were marked late on ${date}. Please be punctual next time.`
              : `You were marked absent on ${date}. Please contact your instructor.`,
          entity_type: 'attendance',
          entity_id: record.class_id,
          created_by: profile!.id,
          target_type: 'individual',
          target_id: record.student_id,
          priority: record.status === 'absent' ? 'high' : 'medium',
        };

        const { data: notification, error: notifError } = await supabase
          .from('notifications')
          .insert([notificationPayload])
          .select('id')
          .single();

        if (!notifError && notification) {
          await supabase
            .from('notification_recipients')
            .insert([{
              notification_id: notification.id,
              user_id: record.student_id,
              is_read: false,
              is_deleted: false,
            }]);

          await sendPushNotification({
            userId: record.student_id,
            title: notificationPayload.title,
            body: notificationPayload.message,
            data: {
              type: 'attendance_alert',
              status: record.status,
              date,
              classId: record.class_id,
              subjectId: record.subject_id,
              studentId: record.student_id,
              notificationId: notification.id,
            },
          });
        }
      }

      return { success: true, message: 'Attendance marked successfully' };
    } catch (err: any) {
      console.error("🔥 Error posting attendance:", err);
      return { success: false, error: err.message };
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

  const onRefresh = async () => {
    setRefreshing(true);
    setLoading(true);

    try {
      if ((profile?.role === 'teacher' || profile?.role === 'admin') && classId) {
        setStudents([]);
        setAttendanceRecords([]);
        setAttendanceSessions([]);
        setCurrentAttendance({});
        setTodaysAttendance({});

        const today = new Date().toISOString().split('T')[0];

        await Promise.all([
          fetchStudents(),
          fetchAttendanceSessions(),
          fetchTodaysAttendance(today),
        ]);

        let query = supabase
          .from('attendance')
          .select(`
            *,
            students (
              full_name,
              roll_number,
              parent_contact
            ),
            subjects (name)
          `)
          .eq('class_id', classId)
          .order('date', { ascending: false });

        if (subjectId) {
          query = query.eq('subject_id', subjectId);
        }

        const { data, error } = await query;

        if (!error && data) {
          setAttendanceRecords(data);
          calculateStats(data);
        }
      } else if (profile?.role === 'student') {
        await fetchStudentAttendance();
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

  const isStudentMarkedForDate = (studentId: string, date: string) => {
    return !!todaysAttendance[studentId];
  };

  const getStudentRecordForDate = (studentId: string, date: string) => {
    return todaysAttendance[studentId] || null;
  };

  const checkAttendanceForDate = async (date: string) => {
    if (!classId || !subjectId) return [];

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
        .eq('subject_id', subjectId)
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